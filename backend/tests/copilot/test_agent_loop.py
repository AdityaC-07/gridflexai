"""Unit tests for the Copilot agent loop — Bedrock fully mocked.

Tests the end-to-end loop: user message → toolUse → toolResult → end_turn.
No AWS credentials or network required.
"""
from __future__ import annotations

import pytest
from unittest.mock import patch, MagicMock

from app.agents.gridflex_copilot.schemas import CopilotQueryRequest, CopilotQueryResponse
from app.agents.gridflex_copilot.agent import run_copilot_query


def _fake_end_turn_response(text="The feeder is stable."):
    return {
        "stopReason": "end_turn",
        "output": {"message": {"role": "assistant", "content": [{"text": text}]}},
        "_latency_ms": 42.0,
        "_model_id": "amazon.nova-lite-v1:0",
    }


def _fake_tool_use_response(tool_name="get_current_grid_state", tool_id="tu-001", inp=None):
    return {
        "stopReason": "tool_use",
        "output": {
            "message": {
                "role": "assistant",
                "content": [{"toolUse": {"toolUseId": tool_id, "name": tool_name, "input": inp or {}}}],
            }
        },
        "_latency_ms": 30.0,
        "_model_id": "amazon.nova-lite-v1:0",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Bedrock disabled → deterministic fallback
# ─────────────────────────────────────────────────────────────────────────────

def test_bedrock_disabled_returns_fallback():
    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = False
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "amazon.nova-lite-v1:0"

        with patch("app.agents.gridflex_copilot.agent._deterministic_fallback") as mock_fb:
            mock_fb.return_value = CopilotQueryResponse(
                answer="Deterministic answer",
                model="amazon.nova-lite-v1:0",
                data_timestamp="2026-01-01T00:00:00+00:00",
                mode="fallback",
            )
            req = CopilotQueryRequest(message="Why is the grid under stress?")
            result = run_copilot_query(req)

        mock_fb.assert_called_once()
        assert result.mode == "fallback"


# ─────────────────────────────────────────────────────────────────────────────
# Bedrock enabled, end_turn on first call
# ─────────────────────────────────────────────────────────────────────────────

def test_bedrock_single_turn_end():
    req = CopilotQueryRequest(message="What is the current grid risk?", feeder_id="F01")

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = True
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "amazon.nova-lite-v1:0"
        mock_cfg.bedrock_guardrail_configured = False

        with patch("app.agents.gridflex_copilot.agent.converse") as mock_conv:
            mock_conv.return_value = _fake_end_turn_response("Risk is LOW.")

            result = run_copilot_query(req)

    assert result.answer == "Risk is LOW."
    assert result.mode == "live"
    assert result.model == "amazon.nova-lite-v1:0"
    assert result.tools_used == []


# ─────────────────────────────────────────────────────────────────────────────
# Bedrock tool-use loop: toolUse → execute → end_turn
# ─────────────────────────────────────────────────────────────────────────────

def test_bedrock_tool_use_then_end_turn():
    req = CopilotQueryRequest(message="Why is the grid stressed?", feeder_id="F01")

    tool_response = _fake_tool_use_response("get_current_grid_state", "tu-001", {"feeder_id": "F01"})
    end_response  = _fake_end_turn_response("The grid is at HIGH risk due to 80 kW gap.")

    call_count = [0]

    def mock_converse(**kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            return tool_response
        return end_response

    fake_tool_result = {"risk_level": "HIGH", "stress_index": 80, "net_gap_kw": 80}

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = True
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "amazon.nova-lite-v1:0"
        mock_cfg.bedrock_guardrail_configured = False

        with patch("app.agents.gridflex_copilot.agent.converse", side_effect=mock_converse):
            with patch("app.agents.gridflex_copilot.agent.execute_tool", return_value=fake_tool_result):
                with patch("app.agents.gridflex_copilot.agent.check_tool_permitted"):
                    result = run_copilot_query(req)

    assert "HIGH" in result.answer or result.answer  # model produced text
    assert len(result.tools_used) == 1
    assert result.tools_used[0].tool_name == "get_current_grid_state"
    assert "grid_state" in result.sources


# ─────────────────────────────────────────────────────────────────────────────
# Permission denied inside the loop → blocked tool result sent back
# ─────────────────────────────────────────────────────────────────────────────

def test_prohibited_tool_blocked_inside_loop():
    req = CopilotQueryRequest(message="Dispatch battery", feeder_id="F01")

    tool_response = _fake_tool_use_response("dispatch", "tu-bad", {})
    end_response  = _fake_end_turn_response("I cannot dispatch resources.")

    call_count = [0]

    def mock_converse(**kwargs):
        call_count[0] += 1
        if call_count[0] == 1:
            return tool_response
        return end_response

    from app.agents.gridflex_copilot.permissions import CopilotPermissionError

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = True
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "amazon.nova-lite-v1:0"
        mock_cfg.bedrock_guardrail_configured = False

        with patch("app.agents.gridflex_copilot.agent.converse", side_effect=mock_converse):
            with patch("app.agents.gridflex_copilot.agent.check_tool_permitted",
                       side_effect=CopilotPermissionError("dispatch", "prohibited")):
                result = run_copilot_query(req)

    # The loop must complete and return an answer (even if it's the fallback text)
    assert result.answer
    # The blocked tool must be recorded
    blocked = [t for t in result.tools_used if t.result_summary == "PERMISSION DENIED"]
    assert len(blocked) == 1
    assert blocked[0].tool_name == "dispatch"


# ─────────────────────────────────────────────────────────────────────────────
# Bedrock unavailable → deterministic fallback (NOT a fabricated AI answer)
# ─────────────────────────────────────────────────────────────────────────────

def test_bedrock_unavailable_returns_deterministic_fallback():
    from app.agents.gridflex_copilot.bedrock import BedrockUnavailableError
    req = CopilotQueryRequest(message="Grid status?", feeder_id="F01")

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = True
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "amazon.nova-lite-v1:0"

        with patch("app.agents.gridflex_copilot.agent._run_bedrock_loop",
                   side_effect=BedrockUnavailableError("No credentials")):
            with patch("app.agents.gridflex_copilot.tools.get_current_grid_state",
                       return_value={"risk_level": "LOW", "stress_index": 12}):
                with patch("app.agents.gridflex_copilot.tools.get_active_reliability_events",
                           return_value={"active_event_count": 0, "events": []}):
                    with patch("app.agents.gridflex_copilot.tools.get_flexibility_pool",
                               return_value={"total_available_kw": 127.5}):
                        result = run_copilot_query(req)

    assert result.mode == "fallback"
    assert "unavailable" in result.answer.lower() or "Bedrock" in result.answer
    # Must NOT look like a fabricated AI answer
    assert "deterministic" in result.answer.lower() or "Bedrock" in result.answer


# ─────────────────────────────────────────────────────────────────────────────
# Response schema validation
# ─────────────────────────────────────────────────────────────────────────────

def test_response_schema_valid():
    req = CopilotQueryRequest(message="Test", feeder_id="F01")

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = False
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "amazon.nova-lite-v1:0"

        with patch("app.agents.gridflex_copilot.agent._deterministic_fallback") as mock_fb:
            mock_fb.return_value = CopilotQueryResponse(
                answer="Test answer",
                model="amazon.nova-lite-v1:0",
                data_timestamp="2026-01-01T00:00:00+00:00",
                mode="fallback",
            )
            result = run_copilot_query(req)

    # Validate all required fields
    assert isinstance(result.answer, str) and result.answer
    assert isinstance(result.model, str) and result.model
    assert isinstance(result.provider, str) and result.provider
    assert isinstance(result.tools_used, list)
    assert isinstance(result.sources, list)
    assert isinstance(result.data_timestamp, str) and result.data_timestamp
    assert result.mode in ("live", "fallback")
