"""Amazon Bedrock Runtime client for the GridFlex Copilot.

This module owns the entire boto3 Bedrock interaction:
  • Client creation (lazy singleton, credential-chain aware)
  • converse() wrapper with full tool-use support
  • Response parsing
  • Latency logging
  • Graceful credential/quota failure handling

SECURITY NOTES:
  • AWS credentials are NEVER logged or returned in API responses.
  • The module relies entirely on the standard boto3 credential chain:
      1. Environment variables (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
      2. ~/.aws/credentials profile
      3. ECS task role / EC2 instance role / IAM role (production)
  • No credentials are accepted as function parameters.
"""
from __future__ import annotations

import json
import logging
import time
from typing import Any

import boto3
from botocore.exceptions import (
    ClientError,
    EndpointResolutionError,
    NoCredentialsError,
    NoRegionError,
)

from app.config import config

logger = logging.getLogger("app.agents.copilot.bedrock")

# ─────────────────────────────────────────────────────────────────────────────
# Bedrock exceptions exposed to callers
# ─────────────────────────────────────────────────────────────────────────────

class BedrockUnavailableError(RuntimeError):
    """Raised when Bedrock cannot be reached (no credentials, no network, etc.)."""


class BedrockModelError(RuntimeError):
    """Raised when the model call fails (throttling, model not found, etc.)."""


# ─────────────────────────────────────────────────────────────────────────────
# Client singleton
# ─────────────────────────────────────────────────────────────────────────────

_client = None


def _get_client():
    """Return a lazy-initialised boto3 bedrock-runtime client.

    Uses the standard credential chain — never accepts credentials as args.
    Returns None (and logs a warning) if credentials are not available so
    callers can degrade gracefully.
    """
    global _client
    if _client is not None:
        return _client
    try:
        _client = boto3.client(
            "bedrock-runtime",
            region_name=config.aws_region or "ap-south-1",
        )
        logger.info(
            "Bedrock client initialised (region=%s, model=%s)",
            config.aws_region,
            config.bedrock_model_id,
        )
        return _client
    except (NoCredentialsError, NoRegionError) as exc:
        logger.warning("Bedrock client unavailable — no credentials: %s", exc)
        return None
    except Exception as exc:
        logger.warning("Bedrock client creation failed: %s", exc)
        return None


def reset_client() -> None:
    """Force re-creation of the Bedrock client (useful for testing)."""
    global _client
    _client = None


# ─────────────────────────────────────────────────────────────────────────────
# Credential probe
# ─────────────────────────────────────────────────────────────────────────────

def credentials_available() -> bool:
    """Return True if AWS credentials are resolvable in the current environment."""
    try:
        import boto3 as b3
        session = b3.session.Session()
        creds = session.get_credentials()
        return bool(creds and creds.access_key)
    except Exception:
        return False


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
    """Call the Bedrock Converse API.

    Parameters
    ----------
    messages:      Conversation history in Converse message format.
    system_prompt: Static system instructions for the model.
    tool_config:   Optional tool configuration dict (toolConfig) for function-calling.
    model_id:      Override the configured model ID.
    max_tokens:    Override the configured max tokens.
    temperature:   Override the configured temperature.

    Returns
    -------
    The full Bedrock Converse API response dict.

    Raises
    ------
    BedrockUnavailableError: If credentials are missing or network is unreachable.
    BedrockModelError:       If the Converse API call fails at the model level.
    """
    client = _get_client()
    if client is None:
        raise BedrockUnavailableError(
            "Bedrock client is not available. "
            "Configure AWS credentials (env vars / IAM role / ~/.aws/credentials)."
        )

    _model_id  = model_id   or config.bedrock_model_id
    _max_tokens = max_tokens or config.bedrock_max_tokens
    _temperature = temperature if temperature is not None else config.bedrock_temperature

    # Build request kwargs
    kwargs: dict[str, Any] = {
        "modelId": _model_id,
        "messages": messages,
        "system": [{"text": system_prompt}],
        "inferenceConfig": {
            "maxTokens": _max_tokens,
            "temperature": _temperature,
        },
    }

    if tool_config:
        kwargs["toolConfig"] = tool_config

    # Optional Guardrail configuration
    if config.bedrock_guardrail_configured:
        kwargs["guardrailConfig"] = {
            "guardrailIdentifier": config.bedrock_guardrail_id,
            "guardrailVersion": config.bedrock_guardrail_version,
            "trace": "enabled",
        }
        logger.debug(
            "Guardrail applied: id=%s version=%s",
            config.bedrock_guardrail_id,
            config.bedrock_guardrail_version,
        )

    t0 = time.monotonic()
    try:
        response = client.converse(**kwargs)
        latency_ms = round((time.monotonic() - t0) * 1000, 1)
        logger.info(
            "Bedrock converse OK — model=%s stop_reason=%s latency=%.1fms",
            _model_id,
            response.get("stopReason", "?"),
            latency_ms,
        )
        response["_latency_ms"] = latency_ms
        response["_model_id"] = _model_id
        return response

    except NoCredentialsError as exc:
        raise BedrockUnavailableError(f"AWS credentials not found: {exc}") from exc

    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "Unknown")
        msg  = exc.response.get("Error", {}).get("Message", str(exc))
        if code in ("AccessDeniedException", "UnauthorizedException"):
            raise BedrockUnavailableError(
                f"Bedrock access denied ({code}): {msg}. "
                "Ensure the IAM role has bedrock:InvokeModel permission."
            ) from exc
        if code in ("ThrottlingException", "ServiceUnavailableException"):
            raise BedrockModelError(
                f"Bedrock throttled/unavailable ({code}): {msg}"
            ) from exc
        if code == "ValidationException":
            raise BedrockModelError(
                f"Bedrock validation error ({code}): {msg}. "
                f"Check model ID '{_model_id}' and region '{config.aws_region}'."
            ) from exc
        raise BedrockModelError(f"Bedrock ClientError ({code}): {msg}") from exc

    except (EndpointResolutionError, ConnectionError) as exc:
        raise BedrockUnavailableError(
            f"Cannot reach Bedrock endpoint in region '{config.aws_region}': {exc}"
        ) from exc

    except Exception as exc:
        raise BedrockModelError(f"Unexpected Bedrock error: {exc}") from exc


# ─────────────────────────────────────────────────────────────────────────────
# Response parsing helpers
# ─────────────────────────────────────────────────────────────────────────────

def extract_text(response: dict[str, Any]) -> str:
    """Extract the text content from a Converse response output block."""
    output = response.get("output", {})
    message = output.get("message", {})
    content = message.get("content", [])
    texts = [block.get("text", "") for block in content if "text" in block]
    return "\n".join(texts).strip()


def extract_tool_uses(response: dict[str, Any]) -> list[dict[str, Any]]:
    """Extract all toolUse blocks from a Converse response content list.

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
    """Return the stopReason from a Converse response ('end_turn', 'tool_use', etc.)."""
    return response.get("stopReason", "end_turn")


def build_tool_result_message(
    tool_use_id: str,
    result: Any,
    is_error: bool = False,
) -> dict[str, Any]:
    """Build a user-role message containing a toolResult block.

    The Converse API expects:
      role: "user"
      content: [{ "toolResult": { "toolUseId": ..., "content": [...] } }]
    """
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
        "role": "user",
        "content": [
            {
                "toolResult": {
                    "toolUseId": tool_use_id,
                    "content": content_blocks,
                    "status": status,
                }
            }
        ],
    }


def build_assistant_tool_use_message(
    response: dict[str, Any],
) -> dict[str, Any]:
    """Re-package the assistant's Converse response as a history message.

    The Converse multi-turn pattern requires the assistant's toolUse message
    to be appended to the conversation history before adding the toolResult.
    """
    output = response.get("output", {})
    message = output.get("message", {})
    return {
        "role": "assistant",
        "content": message.get("content", []),
    }
