"""Unit tests for llm.py — all Groq calls are mocked.

No Groq API key or network access required.
"""
from __future__ import annotations

import json
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest

from app.agents.gridflex_copilot.llm import (
    GroqUnavailableError,
    GroqModelError,
    converse,
    extract_text,
    extract_tool_uses,
    stop_reason,
    build_tool_result_message,
    build_tool_result_block,
    build_assistant_tool_use_message,
    api_key_available,
    credentials_available,
    reset_client,
    _to_openai_messages,
    _tool_config_to_openai,
    _from_openai_response,
)


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def reset_groq_client():
    """Reset the module-level client singleton before each test."""
    reset_client()
    yield
    reset_client()


def _make_chat_response(text: str = "Hello!") -> MagicMock:
    """Build a Groq SDK-style ChatCompletion with plain text content."""
    msg = SimpleNamespace(content=text, tool_calls=None, reasoning=None)
    return SimpleNamespace(
        choices=[SimpleNamespace(message=msg)],
        usage=SimpleNamespace(prompt_tokens=50, completion_tokens=20),
    )


def _make_tool_call_response(
    tool_name: str, tool_id: str, arguments: dict | str
) -> MagicMock:
    """Build a Groq SDK-style ChatCompletion containing one tool call."""
    if isinstance(arguments, dict):
        arguments = json.dumps(arguments)
    tc = SimpleNamespace(
        id=tool_id,
        type="function",
        function=SimpleNamespace(name=tool_name, arguments=arguments),
    )
    msg = SimpleNamespace(content=None, tool_calls=[tc], reasoning=None)
    return SimpleNamespace(
        choices=[SimpleNamespace(message=msg)],
        usage=SimpleNamespace(prompt_tokens=80, completion_tokens=15),
    )


def _user_text_msg(text: str) -> list[dict]:
    return [{"role": "user", "content": [{"text": text}]}]


# ─────────────────────────────────────────────────────────────────────────────
# converse() — success path
# ─────────────────────────────────────────────────────────────────────────────

def test_converse_success():
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = _make_chat_response("Grid is stable.")

    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=mock_client):
        result = converse(
            messages=_user_text_msg("How is the grid?"),
            system_prompt="You are GridFlex.",
        )

    assert result["stopReason"] == "end_turn"
    assert "_latency_ms" in result
    assert result["_model_id"] == "openai/gpt-oss-120b"
    assert extract_text(result) == "Grid is stable."

    # System prompt must be the first OpenAI message
    kwargs = mock_client.chat.completions.create.call_args[1]
    assert kwargs["messages"][0] == {"role": "system", "content": "You are GridFlex."}
    assert kwargs["messages"][1] == {"role": "user", "content": "How is the grid?"}


def test_converse_with_tool_config():
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = _make_tool_call_response(
        "get_current_grid_state", "tu-001", {}
    )

    tool_config = {
        "tools": [{
            "toolSpec": {
                "name": "get_current_grid_state",
                "description": "Returns current grid state.",
                "inputSchema": {"json": {"type": "object", "properties": {}}},
            }
        }],
        "toolChoice": {"auto": {}},
    }

    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=mock_client):
        result = converse(
            messages=_user_text_msg("Grid state?"),
            system_prompt="You are GridFlex.",
            tool_config=tool_config,
        )

    assert result["stopReason"] == "tool_use"
    kwargs = mock_client.chat.completions.create.call_args[1]
    # Translated to OpenAI function-tool format
    assert kwargs["tools"][0]["type"] == "function"
    assert kwargs["tools"][0]["function"]["name"] == "get_current_grid_state"
    assert kwargs["tools"][0]["function"]["parameters"] == {"type": "object", "properties": {}}
    assert kwargs["tool_choice"] == "auto"


def test_converse_uses_config_overrides():
    mock_client = MagicMock()
    mock_client.chat.completions.create.return_value = _make_chat_response("ok")

    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=mock_client):
        converse(
            messages=_user_text_msg("?"),
            system_prompt="sys",
            model_id="openai/gpt-oss-20b",
            max_tokens=256,
            temperature=0.7,
        )

    kwargs = mock_client.chat.completions.create.call_args[1]
    assert kwargs["model"] == "openai/gpt-oss-20b"
    assert kwargs["max_tokens"] == 256
    assert kwargs["temperature"] == 0.7


# ─────────────────────────────────────────────────────────────────────────────
# converse() — failure paths
# ─────────────────────────────────────────────────────────────────────────────

def test_converse_no_client_raises_unavailable():
    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=None):
        with pytest.raises(GroqUnavailableError):
            converse(messages=_user_text_msg("?"), system_prompt="sys")


def test_converse_connection_error_raises_unavailable():
    class APIConnectionError(Exception):
        pass

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = APIConnectionError("Connection refused")

    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=mock_client):
        with pytest.raises(GroqUnavailableError):
            converse(messages=_user_text_msg("?"), system_prompt="sys")


def test_converse_auth_error_raises_unavailable():
    class AuthenticationError(Exception):
        pass

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = AuthenticationError("Invalid API key")

    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=mock_client):
        with pytest.raises(GroqUnavailableError):
            converse(messages=_user_text_msg("?"), system_prompt="sys")


def test_converse_rate_limit_raises_model_error():
    class RateLimitError(Exception):
        pass

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = RateLimitError("Rate exceeded")

    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=mock_client):
        with pytest.raises(GroqModelError):
            converse(messages=_user_text_msg("?"), system_prompt="sys")


def test_converse_http_404_raises_model_error():
    class APIStatusError(Exception):
        status_code = 404

    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = APIStatusError("model_decommissioned")

    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=mock_client):
        with pytest.raises(GroqModelError):
            converse(messages=_user_text_msg("?"), system_prompt="sys")


def test_converse_unexpected_error_raises_model_error():
    mock_client = MagicMock()
    mock_client.chat.completions.create.side_effect = ValueError("boom")

    with patch("app.agents.gridflex_copilot.llm._get_client", return_value=mock_client):
        with pytest.raises(GroqModelError):
            converse(messages=_user_text_msg("?"), system_prompt="sys")


# ─────────────────────────────────────────────────────────────────────────────
# Format translation — Converse style ⇄ OpenAI style
# ─────────────────────────────────────────────────────────────────────────────

def test_to_openai_messages_user_text():
    msgs = _to_openai_messages(_user_text_msg("Hello"), "sys")
    assert msgs[0]["role"] == "system"
    assert msgs[1] == {"role": "user", "content": "Hello"}


def test_to_openai_messages_assistant_tool_use():
    assistant = {
        "role": "assistant",
        "content": [{"toolUse": {"toolUseId": "tu-1", "name": "get_forecast",
                                 "input": {"feeder_id": "F01"}}}],
    }
    msgs = _to_openai_messages([assistant], "sys")
    assert len(msgs) == 2
    assert msgs[1]["tool_calls"][0]["id"] == "tu-1"
    assert msgs[1]["tool_calls"][0]["function"]["name"] == "get_forecast"
    assert json.loads(msgs[1]["tool_calls"][0]["function"]["arguments"]) == {"feeder_id": "F01"}


def test_to_openai_messages_tool_result_json():
    user_msg = {
        "role": "user",
        "content": [{"toolResult": {
            "toolUseId": "tu-1",
            "content": [{"json": {"risk_level": "HIGH"}}],
            "status": "success",
        }}],
    }
    msgs = _to_openai_messages([user_msg], "sys")
    assert msgs[1]["role"] == "tool"
    assert msgs[1]["tool_call_id"] == "tu-1"
    assert json.loads(msgs[1]["content"]) == {"risk_level": "HIGH"}


def test_to_openai_messages_tool_result_error_status():
    user_msg = {
        "role": "user",
        "content": [{"toolResult": {
            "toolUseId": "tu-2",
            "content": [{"text": "Data corrupt"}],
            "status": "error",
        }}],
    }
    msgs = _to_openai_messages([user_msg], "sys")
    assert msgs[1]["role"] == "tool"
    assert msgs[1]["content"].startswith("ERROR:")


def test_to_openai_messages_multiple_tool_results():
    """Multiple toolResult blocks in one user message → one tool message each."""
    user_msg = {
        "role": "user",
        "content": [
            {"toolResult": {"toolUseId": "a", "content": [{"text": "1"}], "status": "success"}},
            {"toolResult": {"toolUseId": "b", "content": [{"text": "2"}], "status": "success"}},
        ],
    }
    msgs = _to_openai_messages([user_msg], "sys")
    tool_msgs = [m for m in msgs if m["role"] == "tool"]
    assert [m["tool_call_id"] for m in tool_msgs] == ["a", "b"]


def test_tool_config_translation():
    tc = _tool_config_to_openai({
        "tools": [{
            "toolSpec": {
                "name": "t1",
                "description": "d1",
                "inputSchema": {"json": {"type": "object", "properties": {"x": {"type": "string"}}}},
            }
        }],
    })
    assert tc[0]["function"]["name"] == "t1"
    assert "properties" in tc[0]["function"]["parameters"]


def test_tool_config_translation_none():
    assert _tool_config_to_openai(None) is None
    assert _tool_config_to_openai({"tools": []}) is None


def test_from_openai_response_invalid_tool_arguments():
    """Unparseable tool arguments degrade to an empty input dict."""
    resp = _make_tool_call_response("some_tool", "tu-9", "{not json")
    result = _from_openai_response(resp, "m", 1.0)
    uses = extract_tool_uses(result)
    assert uses[0]["input"] == {}


# ─────────────────────────────────────────────────────────────────────────────
# Response parsing helpers
# ─────────────────────────────────────────────────────────────────────────────

def test_extract_text_end_turn():
    resp = _make_chat_response("The grid is balanced.")
    result = _from_openai_response(resp, "m", 1.0)
    assert extract_text(result) == "The grid is balanced."


def test_extract_text_empty_content():
    resp = _make_chat_response(None)
    result = _from_openai_response(resp, "m", 1.0)
    assert extract_text(result) == ""


def test_extract_tool_uses():
    resp = _make_tool_call_response("get_forecast", "tu-abc", {"feeder_id": "F01"})
    result = _from_openai_response(resp, "m", 1.0)
    uses = extract_tool_uses(result)
    assert len(uses) == 1
    assert uses[0]["name"] == "get_forecast"
    assert uses[0]["toolUseId"] == "tu-abc"
    assert uses[0]["input"] == {"feeder_id": "F01"}
    assert stop_reason(result) == "tool_use"


def test_extract_tool_uses_empty_for_text_response():
    resp = _make_chat_response("Hello!")
    result = _from_openai_response(resp, "m", 1.0)
    assert extract_tool_uses(result) == []
    assert stop_reason(result) == "end_turn"


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


def test_build_tool_result_block_round_trip_through_translation():
    """A built toolResult must translate into a valid OpenAI tool message."""
    block = build_tool_result_block("tu-3", {"a": 1})
    msgs = _to_openai_messages([{"role": "user", "content": [block]}], "sys")
    assert msgs[1]["role"] == "tool"
    assert msgs[1]["tool_call_id"] == "tu-3"


def test_build_assistant_tool_use_message():
    resp = _make_tool_call_response("get_forecast", "tu-xyz", {})
    result = _from_openai_response(resp, "m", 1.0)
    msg = build_assistant_tool_use_message(result)
    assert msg["role"] == "assistant"
    assert msg == result["output"]["message"]


def test_build_assistant_tool_use_message_rejects_empty_content():
    with pytest.raises(ValueError, match="empty assistant message"):
        build_assistant_tool_use_message(
            {"output": {"message": {"role": "assistant", "content": []}}}
        )


# ─────────────────────────────────────────────────────────────────────────────
# API key probe
# ─────────────────────────────────────────────────────────────────────────────

def test_api_key_available_true():
    with patch.object(__import__("app.config", fromlist=["config"]).config,
                       "groq_api_key", "gsk_test_key"):
        assert api_key_available() is True


def test_api_key_available_false_when_none():
    with patch.object(__import__("app.config", fromlist=["config"]).config,
                       "groq_api_key", ""):
        assert api_key_available() is False


def test_credentials_available_is_alias():
    """credentials_available() kept as a backward-compatible alias."""
    assert credentials_available is api_key_available
