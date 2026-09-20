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
        "_model_id": "apac.amazon.nova-lite-v1:0",
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
        "_model_id": "apac.amazon.nova-lite-v1:0",
    }


def _fake_multi_tool_use_response(tools):
    content = [
        {"toolUse": {"toolUseId": t["id"], "name": t["name"], "input": t.get("input", {})}}
        for t in tools
    ]
    return {
        "stopReason": "tool_use",
        "output": {
            "message": {
                "role": "assistant",
                "content": content,
            }
        },
        "_latency_ms": 35.0,
        "_model_id": "apac.amazon.nova-lite-v1:0",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Bedrock disabled → deterministic fallback
# ─────────────────────────────────────────────────────────────────────────────

def test_bedrock_disabled_returns_fallback():
    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = False
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "apac.amazon.nova-lite-v1:0"

        with patch("app.agents.gridflex_copilot.agent._deterministic_fallback") as mock_fb:
            mock_fb.return_value = CopilotQueryResponse(
                answer="Deterministic answer",
                model="apac.amazon.nova-lite-v1:0",
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
        mock_cfg.bedrock_model_id = "apac.amazon.nova-lite-v1:0"
        mock_cfg.bedrock_guardrail_configured = False

        with patch("app.agents.gridflex_copilot.agent.converse") as mock_conv:
            mock_conv.return_value = _fake_end_turn_response("Risk is LOW.")

            result = run_copilot_query(req)

    assert result.answer == "Risk is LOW."
    assert result.mode == "live"
    assert result.model == "apac.amazon.nova-lite-v1:0"
    assert result.tools_used == []


# ─────────────────────────────────────────────────────────────────────────────
# Bedrock tool-use loop: toolUse → execute → end_turn
# ─────────────────────────────────────────────────────────────────────────────

def test_bedrock_tool_use_then_end_turn():
    req = CopilotQueryRequest(message="Why is the grid stressed?", feeder_id="F01")

    tool_response = _fake_tool_use_response("get_current_grid_state", "tu-001", {"feeder_id": "F01"})
    end_response  = _fake_end_turn_response("The grid is at HIGH risk due to 80 kW gap.")

    call_history = []

    def mock_converse(messages, **kwargs):
        call_history.append(messages)
        if len(call_history) == 1:
            return tool_response
        return end_response

    fake_tool_result = {"risk_level": "HIGH", "stress_index": 80, "net_gap_kw": 80}

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = True
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "apac.amazon.nova-lite-v1:0"
        mock_cfg.bedrock_guardrail_configured = False

        with patch("app.agents.gridflex_copilot.agent.converse", side_effect=mock_converse):
            with patch("app.agents.gridflex_copilot.agent.execute_tool", return_value=fake_tool_result):
                with patch("app.agents.gridflex_copilot.agent.check_tool_permitted"):
                    result = run_copilot_query(req)

    assert len(call_history) == 2
    # Verify second call history format:
    # messages[0] = user question
    # messages[1] = assistant toolUse
    # messages[2] = user toolResult
    second_call_msgs = call_history[1]
    assert len(second_call_msgs) == 3
    assert second_call_msgs[1]["role"] == "assistant"
    assert second_call_msgs[1] == tool_response["output"]["message"]
    assert second_call_msgs[2]["role"] == "user"
    assert len(second_call_msgs[2]["content"]) == 1
    assert second_call_msgs[2]["content"][0]["toolResult"]["toolUseId"] == "tu-001"

    assert len(result.tools_used) == 1
    assert result.tools_used[0].tool_name == "get_current_grid_state"
    assert "grid_state" in result.sources


# ─────────────────────────────────────────────────────────────────────────────
# Multiple tool-use blocks in a single response turn
# ─────────────────────────────────────────────────────────────────────────────

def test_multiple_tool_use_blocks_in_single_turn():
    req = CopilotQueryRequest(message="Check grid state and forecast", feeder_id="F01")

    multi_tool_response = _fake_multi_tool_use_response([
        {"id": "tu-101", "name": "get_current_grid_state", "input": {"feeder_id": "F01"}},
        {"id": "tu-102", "name": "get_forecast", "input": {"feeder_id": "F01"}},
    ])
    end_response = _fake_end_turn_response("Grid state and forecast checked.")

    call_history = []

    def mock_converse(messages, **kwargs):
        call_history.append(messages)
        if len(call_history) == 1:
            return multi_tool_response
        return end_response

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = True
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "apac.amazon.nova-lite-v1:0"
        mock_cfg.bedrail_configured = False

        with patch("app.agents.gridflex_copilot.agent.converse", side_effect=mock_converse):
            with patch("app.agents.gridflex_copilot.agent.execute_tool", return_value={"status": "ok"}):
                with patch("app.agents.gridflex_copilot.agent.check_tool_permitted"):
                    result = run_copilot_query(req)

    assert len(call_history) == 2
    second_call_msgs = call_history[1]
    assert len(second_call_msgs) == 3  # user -> assistant(multi toolUse) -> user(multi toolResult)
    assert second_call_msgs[1]["role"] == "assistant"
    assert second_call_msgs[1] == multi_tool_response["output"]["message"]
    assert len(second_call_msgs[1]["content"]) == 2

    # User message MUST contain EXACTLY 2 toolResult blocks in the SAME message
    user_tool_msg = second_call_msgs[2]
    assert user_tool_msg["role"] == "user"
    assert len(user_tool_msg["content"]) == 2
    tool_result_ids = [block["toolResult"]["toolUseId"] for block in user_tool_msg["content"]]
    assert tool_result_ids == ["tu-101", "tu-102"]
    assert {
        block["toolResult"]["toolUseId"] for block in user_tool_msg["content"]
    } == {
        block["toolUse"]["toolUseId"]
        for block in multi_tool_response["output"]["message"]["content"]
    }

    assert len(result.tools_used) == 2


# ─────────────────────────────────────────────────────────────────────────────
# Tool execution error handled gracefully as toolResult status=error
# ─────────────────────────────────────────────────────────────────────────────

def test_tool_execution_error_handled_as_tool_result():
    req = CopilotQueryRequest(message="Check broken tool", feeder_id="F01")

    tool_response = _fake_tool_use_response("get_forecast", "tu-err", {})
    end_response  = _fake_end_turn_response("Forecast unavailable due to internal error.")

    call_history = []

    def mock_converse(messages, **kwargs):
        call_history.append(messages)
        if len(call_history) == 1:
            return tool_response
        return end_response

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = True
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "apac.amazon.nova-lite-v1:0"
        mock_cfg.bedrail_configured = False

        with patch("app.agents.gridflex_copilot.agent.converse", side_effect=mock_converse):
            with patch("app.agents.gridflex_copilot.agent.execute_tool", side_effect=ValueError("Data corrupt")):
                with patch("app.agents.gridflex_copilot.agent.check_tool_permitted"):
                    result = run_copilot_query(req)

    second_call_msgs = call_history[1]
    tool_result_block = second_call_msgs[2]["content"][0]["toolResult"]
    assert tool_result_block["toolUseId"] == "tu-err"
    assert tool_result_block["status"] == "error"
    assert "ERROR: Tool execution failed" in tool_result_block["content"][0]["text"]
    assert result.tools_used[0].result_summary.startswith("ERROR:")


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
        mock_cfg.bedrock_model_id = "apac.amazon.nova-lite-v1:0"

        with patch("app.agents.gridflex_copilot.agent.converse", side_effect=mock_converse):
            with patch("app.agents.gridflex_copilot.agent.check_tool_permitted",
                       side_effect=CopilotPermissionError("dispatch", "prohibited")):
                result = run_copilot_query(req)

    assert result.answer
    blocked = [t for t in result.tools_used if t.result_summary == "PERMISSION DENIED"]
    assert len(blocked) == 1
    assert blocked[0].tool_name == "dispatch"


# ─────────────────────────────────────────────────────────────────────────────
# Bedrock unavailable → deterministic fallback
# ─────────────────────────────────────────────────────────────────────────────

def test_bedrock_unavailable_returns_deterministic_fallback():
    from app.agents.gridflex_copilot.bedrock import BedrockUnavailableError
    req = CopilotQueryRequest(message="Grid status?", feeder_id="F01")

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = True
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "apac.amazon.nova-lite-v1:0"

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


# ─────────────────────────────────────────────────────────────────────────────
# Response schema validation
# ─────────────────────────────────────────────────────────────────────────────

def test_response_schema_valid():
    req = CopilotQueryRequest(message="Test", feeder_id="F01")

    with patch("app.agents.gridflex_copilot.agent.config") as mock_cfg:
        mock_cfg.bedrock_enabled = False
        mock_cfg.feeder_id = "F01"
        mock_cfg.bedrock_model_id = "apac.amazon.nova-lite-v1:0"

        with patch("app.agents.gridflex_copilot.agent._deterministic_fallback") as mock_fb:
            mock_fb.return_value = CopilotQueryResponse(
                answer="Test answer",
                model="apac.amazon.nova-lite-v1:0",
                data_timestamp="2026-01-01T00:00:00+00:00",
                mode="fallback",
            )
            result = run_copilot_query(req)

    assert isinstance(result.answer, str) and result.answer
    assert isinstance(result.model, str) and result.model
    assert isinstance(result.provider, str) and result.provider
    assert isinstance(result.tools_used, list)
    assert isinstance(result.sources, list)
    assert isinstance(result.data_timestamp, str) and result.data_timestamp
    assert result.mode in ("live", "fallback")
