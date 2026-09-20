"""Unit tests for bedrock.py — all Bedrock calls are mocked.

No AWS credentials or network access required.
"""
from __future__ import annotations

import pytest
from unittest.mock import MagicMock, patch

from app.agents.gridflex_copilot.bedrock import (
    BedrockUnavailableError,
    BedrockModelError,
    converse,
    extract_text,
    extract_tool_uses,
    stop_reason,
    build_tool_result_message,
    build_assistant_tool_use_message,
    credentials_available,
    reset_client,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_bedrock_client():
    """Reset the module-level client singleton before each test."""
    reset_client()
    yield
    reset_client()


def _make_converse_response(text: str = "Hello!", stop: str = "end_turn") -> dict:
    return {
        "stopReason": stop,
        "output": {
            "message": {
                "role": "assistant",
                "content": [{"text": text}],
            }
        },
        "usage": {"inputTokens": 50, "outputTokens": 20},
    }


def _make_tool_use_response(tool_name: str, tool_id: str, inp: dict) -> dict:
    return {
        "stopReason": "tool_use",
        "output": {
            "message": {
                "role": "assistant",
                "content": [
                    {
                        "toolUse": {
                            "toolUseId": tool_id,
                            "name": tool_name,
                            "input": inp,
                        }
                    }
                ],
            }
        },
        "usage": {"inputTokens": 80, "outputTokens": 15},
    }


# ─────────────────────────────────────────────────────────────────────────────
# converse() — success path
# ─────────────────────────────────────────────────────────────────────────────

def test_converse_success():
    mock_client = MagicMock()
    mock_resp = _make_converse_response("Grid is stable.")
    mock_client.converse.return_value = mock_resp

    with patch("app.agents.gridflex_copilot.bedrock._get_client", return_value=mock_client):
        result = converse(
            messages=[{"role": "user", "content": [{"text": "How is the grid?"}]}],
            system_prompt="You are GridFlex.",
        )

    assert result["stopReason"] == "end_turn"
    assert "_latency_ms" in result
    assert "_model_id" in result


def test_converse_with_tool_config():
    mock_client = MagicMock()
    mock_resp = _make_tool_use_response("get_current_grid_state", "tu-001", {})
    mock_client.converse.return_value = mock_resp

    with patch("app.agents.gridflex_copilot.bedrock._get_client", return_value=mock_client):
        result = converse(
            messages=[{"role": "user", "content": [{"text": "Grid state?"}]}],
            system_prompt="You are GridFlex.",
            tool_config={"tools": [], "toolChoice": {"auto": {}}},
        )

    assert result["stopReason"] == "tool_use"
    # Verify converse was called with toolConfig
    call_kwargs = mock_client.converse.call_args[1]
    assert "toolConfig" in call_kwargs


# ─────────────────────────────────────────────────────────────────────────────
# converse() — failure paths
# ─────────────────────────────────────────────────────────────────────────────

def test_converse_no_client_raises_unavailable():
    with patch("app.agents.gridflex_copilot.bedrock._get_client", return_value=None):
        with pytest.raises(BedrockUnavailableError):
            converse(
                messages=[{"role": "user", "content": [{"text": "?"}]}],
                system_prompt="sys",
            )


def test_converse_no_credentials_raises_unavailable():
    from botocore.exceptions import NoCredentialsError
    mock_client = MagicMock()
    mock_client.converse.side_effect = NoCredentialsError()

    with patch("app.agents.gridflex_copilot.bedrock._get_client", return_value=mock_client):
        with pytest.raises(BedrockUnavailableError):
            converse(
                messages=[{"role": "user", "content": [{"text": "?"}]}],
                system_prompt="sys",
            )


def test_converse_access_denied_raises_unavailable():
    from botocore.exceptions import ClientError
    mock_client = MagicMock()
    mock_client.converse.side_effect = ClientError(
        {"Error": {"Code": "AccessDeniedException", "Message": "Not authorized"}},
        "Converse",
    )

    with patch("app.agents.gridflex_copilot.bedrock._get_client", return_value=mock_client):
        with pytest.raises(BedrockUnavailableError):
            converse(
                messages=[{"role": "user", "content": [{"text": "?"}]}],
                system_prompt="sys",
            )


def test_converse_throttling_raises_model_error():
    from botocore.exceptions import ClientError
    mock_client = MagicMock()
    mock_client.converse.side_effect = ClientError(
        {"Error": {"Code": "ThrottlingException", "Message": "Rate exceeded"}},
        "Converse",
    )

    with patch("app.agents.gridflex_copilot.bedrock._get_client", return_value=mock_client):
        with pytest.raises(BedrockModelError):
            converse(
                messages=[{"role": "user", "content": [{"text": "?"}]}],
                system_prompt="sys",
            )


# ─────────────────────────────────────────────────────────────────────────────
# Response parsing
# ─────────────────────────────────────────────────────────────────────────────

def test_extract_text_end_turn():
    resp = _make_converse_response("The grid is balanced.")
    assert extract_text(resp) == "The grid is balanced."


def test_extract_text_empty_content():
    resp = {"stopReason": "end_turn", "output": {"message": {"content": []}}}
    assert extract_text(resp) == ""


def test_extract_tool_uses():
    resp = _make_tool_use_response("get_forecast", "tu-abc", {"feeder_id": "F01"})
    uses = extract_tool_uses(resp)
    assert len(uses) == 1
    assert uses[0]["name"] == "get_forecast"
    assert uses[0]["toolUseId"] == "tu-abc"
    assert uses[0]["input"] == {"feeder_id": "F01"}


def test_extract_tool_uses_empty_for_text_response():
    resp = _make_converse_response("Hello!")
    uses = extract_tool_uses(resp)
    assert uses == []


def test_stop_reason_end_turn():
    resp = _make_converse_response("Hi!")
    assert stop_reason(resp) == "end_turn"


def test_stop_reason_tool_use():
    resp = _make_tool_use_response("some_tool", "id-1", {})
    assert stop_reason(resp) == "tool_use"


# ─────────────────────────────────────────────────────────────────────────────
# Message builders
# ─────────────────────────────────────────────────────────────────────────────

def test_build_tool_result_message_success():
    msg = build_tool_result_message("tu-1", {"risk_level": "HIGH"}, is_error=False)
    assert msg["role"] == "user"
    tr = msg["content"][0]["toolResult"]
    assert tr["toolUseId"] == "tu-1"
    assert tr["status"] == "success"
    assert tr["content"][0]["json"] == {"risk_level": "HIGH"}


def test_build_tool_result_message_error():
    msg = build_tool_result_message("tu-2", "Something went wrong", is_error=True)
    tr = msg["content"][0]["toolResult"]
    assert tr["status"] == "error"
    assert "ERROR" in tr["content"][0]["text"]


def test_build_assistant_tool_use_message():
    resp = _make_tool_use_response("get_forecast", "tu-xyz", {})
    msg = build_assistant_tool_use_message(resp)
    assert msg["role"] == "assistant"
    assert any("toolUse" in block for block in msg["content"])


# ─────────────────────────────────────────────────────────────────────────────
# credentials_available() — mocked
# ─────────────────────────────────────────────────────────────────────────────

def test_credentials_available_true():
    """credentials_available returns True when boto3 session resolves credentials."""
    mock_resolved = MagicMock()
    mock_resolved.access_key = "AKIAIOSFODNN7EXAMPLE"

    mock_creds = MagicMock()
    mock_creds.resolve_credentials.return_value = mock_resolved

    mock_session = MagicMock()
    mock_session.get_credentials.return_value = mock_creds

    # Patch boto3.session.Session at the point where credentials_available() uses it
    with patch("boto3.session.Session", return_value=mock_session):
        result = credentials_available()
    assert result is True


def test_credentials_available_false_when_none():
    """credentials_available returns False when no credentials are configured."""
    mock_session = MagicMock()
    mock_session.get_credentials.return_value = None

    with patch("boto3.session.Session", return_value=mock_session):
        result = credentials_available()
    assert result is False
