"""Groq LLM client for the GridFlex Copilot.

This module owns the entire Groq (OpenAI-compatible Chat Completions) interaction:
  • Client creation (lazy singleton, GROQ_API_KEY aware)
  • converse() wrapper with full tool-use (function calling) support
  • Translation between the internal Converse-style message format and the
    OpenAI chat format expected by the Groq API
  • Response parsing, latency logging, graceful failure handling

Why this shape
──────────────
The agent loop, permission layer, and tool-result builders are written against
a Converse-style contract (content blocks with ``text`` / ``toolUse`` /
``toolResult``). Rather than rewrite that proven logic, this module adapts to
Groq's OpenAI-compatible API at the boundary:

  Converse messages ──► OpenAI messages ──► Groq Chat Completions API
  Converse response ◄── OpenAI response ◄── Groq Chat Completions API

SECURITY NOTES:
  • The GROQ_API_KEY is NEVER logged or returned in API responses.
  • No credentials are accepted as function parameters.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any

from app.config import config

logger = logging.getLogger("app.agents.copilot.llm")

try:
    import groq as groq_sdk
except ImportError:  # pragma: no cover - exercised only when SDK missing
    groq_sdk = None  # type: ignore


# ─────────────────────────────────────────────────────────────────────────────
# Groq exceptions exposed to callers
# ─────────────────────────────────────────────────────────────────────────────

class GroqUnavailableError(RuntimeError):
    """Raised when Groq cannot be reached (no API key, no network, bad key)."""


class GroqModelError(RuntimeError):
    """Raised when the model call fails (rate limit, invalid model, etc.)."""


# Backward-compatible aliases (older code/tests used the Bedrock names)
BedrockUnavailableError = GroqUnavailableError
BedrockModelError = GroqModelError


# ─────────────────────────────────────────────────────────────────────────────
# Client singleton
# ─────────────────────────────────────────────────────────────────────────────

_client = None
_client_initialised = False


def _get_client():
    """Return a lazy-initialised Groq client.

    Uses GROQ_API_KEY from config — never accepts credentials as args.
    Returns None (and logs a warning) if the key/SDK is not available so
    callers can degrade gracefully.
    """
    global _client, _client_initialised
    if _client_initialised:
        return _client
    _client_initialised = True

    if groq_sdk is None:
        logger.warning("Groq SDK not installed — run `pip install groq`.")
        return None
    if not config.groq_api_key:
        logger.warning("Groq client unavailable — GROQ_API_KEY is not set.")
        return None
    try:
        _client = groq_sdk.Groq(api_key=config.groq_api_key)
        logger.info(
            "Groq client initialised (model=%s)", config.groq_model,
        )
        return _client
    except Exception as exc:
        logger.warning("Groq client creation failed: %s", exc)
        return None


def reset_client() -> None:
    """Force re-creation of the Groq client (useful for testing)."""
    global _client, _client_initialised
    _client = None
    _client_initialised = False


# ─────────────────────────────────────────────────────────────────────────────
# API key probe
# ─────────────────────────────────────────────────────────────────────────────

def api_key_available() -> bool:
    """Return True if a Groq API key is configured in the current environment."""
    return bool(config.groq_api_key)


# Backward-compatible alias (older code called this credentials_available)
credentials_available = api_key_available


# ─────────────────────────────────────────────────────────────────────────────
# Format translation helpers
# ─────────────────────────────────────────────────────────────────────────────

def _tool_config_to_openai(tool_config: dict[str, Any] | None) -> list[dict[str, Any]] | None:
    """Translate a Converse toolConfig dict to OpenAI ``tools`` list.

    Converse:  {"tools": [{"toolSpec": {"name", "description", "inputSchema": {"json": ...}}}]}
    OpenAI:    [{"type": "function", "function": {"name", "description", "parameters"}}]
    """
    if not tool_config:
        return None
    tools = []
    for spec in tool_config.get("tools", []):
        tool_spec = spec.get("toolSpec", spec)
        parameters = tool_spec.get("inputSchema", {})
        if isinstance(parameters, dict) and "json" in parameters:
            parameters = parameters["json"]
        tools.append({
            "type": "function",
            "function": {
                "name": tool_spec.get("name", ""),
                "description": tool_spec.get("description", ""),
                "parameters": parameters or {"type": "object", "properties": {}},
            },
        })
    return tools or None


def _to_openai_messages(
    messages: list[dict[str, Any]],
    system_prompt: str,
) -> list[dict[str, Any]]:
    """Translate Converse-style messages into OpenAI chat messages.

    Handles:
      • user text blocks          → {"role": "user", "content": str}
      • user toolResult blocks    → {"role": "tool", "tool_call_id": ...} (one per result)
      • assistant toolUse blocks  → assistant message with ``tool_calls``
    """
    openai_messages: list[dict[str, Any]] = [{"role": "system", "content": system_prompt}]

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        # Plain string content (already OpenAI style)
        if isinstance(content, str):
            openai_messages.append({"role": role, "content": content})
            continue

        if role == "assistant":
            texts: list[str] = []
            tool_calls: list[dict[str, Any]] = []
            for block in content or []:
                if "text" in block:
                    texts.append(block["text"])
                elif "toolUse" in block:
                    tu = block["toolUse"]
                    tool_calls.append({
                        "id": tu.get("toolUseId", ""),
                        "type": "function",
                        "function": {
                            "name": tu.get("name", ""),
                            "arguments": json.dumps(tu.get("input", {})),
                        },
                    })
            assistant_msg: dict[str, Any] = {
                "role": "assistant",
                "content": "\n".join(texts) if texts else None,
            }
            if tool_calls:
                assistant_msg["tool_calls"] = tool_calls
            openai_messages.append(assistant_msg)

        elif role == "user":
            # A user message may contain text blocks and/or toolResult blocks.
            # OpenAI requires each tool result as its own role:"tool" message.
            pending_text: list[str] = []
            for block in content or []:
                if "text" in block:
                    pending_text.append(block["text"])
                elif "toolResult" in block:
                    tr = block["toolResult"]
                    if pending_text:
                        openai_messages.append({
                            "role": "user",
                            "content": "\n".join(pending_text),
                        })
                        pending_text = []
                    result_blocks = tr.get("content", [])
                    if any("json" in b for b in result_blocks):
                        payload = next(
                            (b["json"] for b in result_blocks if "json" in b), {}
                        )
                        result_text = json.dumps(payload, default=str)
                    else:
                        result_text = "\n".join(
                            b.get("text", "") for b in result_blocks
                        )
                    if tr.get("status") == "error":
                        result_text = f"ERROR: {result_text}"
                    openai_messages.append({
                        "role": "tool",
                        "tool_call_id": tr.get("toolUseId", ""),
                        "content": result_text,
                    })
            if pending_text:
                openai_messages.append({
                    "role": "user",
                    "content": "\n".join(pending_text),
                })

        else:
            openai_messages.append({"role": role, "content": content})

    return openai_messages


def _from_openai_response(response: Any, model_id: str, latency_ms: float) -> dict[str, Any]:
    """Translate a Groq ChatCompletion into a Converse-style response dict."""
    choice = response.choices[0]
    message = choice.message
    content: list[dict[str, Any]] = []

    text = getattr(message, "content", None)
    if text:
        content.append({"text": text})

    tool_calls = getattr(message, "tool_calls", None) or []
    for tc in tool_calls:
        raw_args = (tc.function.arguments or "{}") if tc.function else "{}"
        try:
            args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
        except (json.JSONDecodeError, TypeError):
            logger.warning("Tool call '%s' had unparseable arguments; using {}", tc.id)
            args = {}
        content.append({
            "toolUse": {
                "toolUseId": tc.id,
                "name": tc.function.name if tc.function else "",
                "input": args,
            }
        })

    usage = getattr(response, "usage", None)
    return {
        "output": {"message": {"role": "assistant", "content": content}},
        "stopReason": "tool_use" if tool_calls else "end_turn",
        "usage": {
            "inputTokens": getattr(usage, "prompt_tokens", 0) or 0,
            "outputTokens": getattr(usage, "completion_tokens", 0) or 0,
        },
        "_latency_ms": latency_ms,
        "_model_id": model_id,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Core converse wrapper
# ─────────────────────────────────────────────────────────────────────────────

def converse(
    messages: list[dict[str, Any]],
    system_prompt: str,
    tool_config: dict[str, Any] | None = None,
    model_id: str | None = None,
    max_tokens: int | None = None,
    temperature: float | None = None,
) -> dict[str, Any]:
    """Call the Groq Chat Completions API.

    Parameters
    ----------
    messages:      Conversation history in Converse message format.
    system_prompt: Static system instructions for the model.
    tool_config:   Optional Converse toolConfig dict for function-calling.
    model_id:      Override the configured model ID.
    max_tokens:    Override the configured max tokens.
    temperature:   Override the configured temperature.

    Returns
    -------
    A Converse-style response dict (output.message / stopReason / usage
    plus ``_latency_ms`` and ``_model_id`` metadata).

    Raises
    ------
    GroqUnavailableError: If the API key is missing or Groq is unreachable.
    GroqModelError:       If the API call fails at the model level.
    """
    client = _get_client()
    if client is None:
        raise GroqUnavailableError(
            "Groq client is not available. "
            "Set GROQ_API_KEY (https://console.groq.com/keys) and install the `groq` package."
        )

    _model_id = model_id or config.groq_model
    _max_tokens = max_tokens or config.groq_max_tokens
    _temperature = temperature if temperature is not None else config.groq_temperature

    kwargs: dict[str, Any] = {
        "model": _model_id,
        "messages": _to_openai_messages(messages, system_prompt),
        "max_tokens": _max_tokens,
        "temperature": _temperature,
    }

    tools = _tool_config_to_openai(tool_config)
    if tools:
        kwargs["tools"] = tools
        kwargs["tool_choice"] = "auto"

    t0 = time.monotonic()
    try:
        response = client.chat.completions.create(**kwargs)
        latency_ms = round((time.monotonic() - t0) * 1000, 1)
        result = _from_openai_response(response, _model_id, latency_ms)
        logger.info(
            "Groq chat OK — model=%s stop_reason=%s latency=%.1fms",
            _model_id,
            result["stopReason"],
            latency_ms,
        )
        return result

    except Exception as exc:
        status_code = getattr(exc, "status_code", None)
        try:
            status_code = int(status_code) if status_code is not None else None
        except (TypeError, ValueError):
            status_code = None
        exc_name = type(exc).__name__
        message = str(exc)

        # Connectivity / auth problems → unavailable (caller degrades gracefully)
        if exc_name in ("APIConnectionError", "APITimeoutError", "AuthenticationError",
                        "PermissionDeniedError"):
            raise GroqUnavailableError(f"Groq connection/auth error: {message}") from exc
        if status_code in (401, 403):
            raise GroqUnavailableError(f"Groq authentication failed: {message}") from exc

        # Rate limits / bad requests / server errors → model error
        if exc_name in ("RateLimitError", "BadRequestError", "APIStatusError",
                        "InternalServerError"):
            raise GroqModelError(f"Groq API error ({exc_name}): {message}") from exc
        if status_code in (400, 404, 429, 500, 502, 503):
            raise GroqModelError(
                f"Groq API error (HTTP {status_code}): {message}. "
                f"Check model ID '{_model_id}' is available on your Groq plan."
            ) from exc

        raise GroqModelError(f"Unexpected Groq error: {message}") from exc


# ─────────────────────────────────────────────────────────────────────────────
# Response parsing helpers (Converse-style contract)
# ─────────────────────────────────────────────────────────────────────────────

def extract_text(response: dict[str, Any]) -> str:
    """Extract the text content from a response output block."""
    output = response.get("output", {})
    message = output.get("message", {})
    content = message.get("content", [])
    texts = [block.get("text", "") for block in content if "text" in block]
    return "\n".join(texts).strip()


def extract_tool_uses(response: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract all toolUse blocks from a response content list.

    Returns a list of dicts, each with:
        toolUseId, name, input (dict)
    """
    output = response.get("output", {})
    message = output.get("message", {})
    content = message.get("content", [])
    uses = []
    for block in content:
        if "toolUse" in block:
            tu = block["toolUse"]
            uses.append({
                "toolUseId": tu.get("toolUseId", ""),
                "name": tu.get("name", ""),
                "input": tu.get("input", {}),
            })
    return uses


def stop_reason(response: dict[str, Any]) -> str:
    """Return the stopReason from a response ('end_turn', 'tool_use', etc.)."""
    return response.get("stopReason", "end_turn")


def build_tool_result_block(
    tool_use_id: str,
    result: Any,
    is_error: bool = False,
) -> dict[str, Any]:
    """Build a single toolResult block dict for inclusion in a user message."""
    if is_error:
        content_blocks = [{"text": f"ERROR: {result}"}]
        status = "error"
    else:
        if isinstance(result, (dict, list)):
            content_blocks = [{"json": result}]
        else:
            content_blocks = [{"text": str(result)}]
        status = "success"

    return {
        "toolResult": {
            "toolUseId": tool_use_id,
            "content": content_blocks,
            "status": status,
        }
    }


def build_tool_result_message(
    tool_use_id: str,
    result: Any,
    is_error: bool = False,
) -> dict[str, Any]:
    """Build a user-role message containing a single toolResult block."""
    return {
        "role": "user",
        "content": [build_tool_result_block(tool_use_id, result, is_error=is_error)],
    }


def build_assistant_tool_use_message(
    response: dict[str, Any],
) -> dict[str, Any]:
    """Return the assistant message exactly as returned by the model.

    The multi-turn pattern requires the assistant's toolUse message to be
    appended to the conversation history before adding the toolResult.
    Preserving the complete message is important when a response contains
    multiple content blocks or provider-specific message fields.
    """
    output = response.get("output", {})
    message = output.get("message", {})
    if not message or not message.get("content"):
        raise ValueError("Groq tool-use response contained an empty assistant message")
    return dict(message)
