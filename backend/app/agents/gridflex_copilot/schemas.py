"""Pydantic schemas for the GridFlex Copilot API.

These define the exact wire format for /api/v1/copilot/query and /status.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────────────────────
# Request
# ─────────────────────────────────────────────────────────────────────────────

class CopilotQueryRequest(BaseModel):
    """Request body for POST /api/v1/copilot/query."""
    message: str = Field(..., min_length=1, max_length=2000,
                         description="Natural-language question for the GridFlex Copilot.")
    feeder_id: str = Field(default="F01",
                           description="Target feeder ID (default F01 — Dharavi North).")
    event_id: str | None = Field(default=None,
                                 description="Optional reliability event ID for context.")
    context: dict[str, Any] = Field(default_factory=dict,
                                    description="Additional context key-value pairs.")


# ─────────────────────────────────────────────────────────────────────────────
# Response
# ─────────────────────────────────────────────────────────────────────────────

class ToolCallRecord(BaseModel):
    """Record of a single tool invocation during the Converse loop."""
    tool_name: str
    tool_use_id: str
    input_args: dict[str, Any] = Field(default_factory=dict)
    result_summary: str = ""


class CopilotQueryResponse(BaseModel):
    """Response body for POST /api/v1/copilot/query."""
    answer: str = Field(..., description="AI-generated natural-language answer.")
    model: str = Field(..., description="Bedrock model ID used for inference.")
    provider: str = Field(default="Amazon Bedrock")
    tools_used: list[ToolCallRecord] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list,
                               description="GridFlex data sources consulted.")
    data_timestamp: str = Field(..., description="ISO-8601 timestamp of the response.")
    mode: str = Field(default="live", description="'live' or 'fallback'.")
    latency_ms: float | None = Field(default=None,
                                     description="End-to-end inference latency in ms.")
    feeder_id: str = Field(default="F01")
    event_id: str | None = None


class CopilotStatusResponse(BaseModel):
    """Response body for GET /api/v1/copilot/status."""
    enabled: bool
    provider: str = "Amazon Bedrock"
    model: str
    region: str
    credentials_available: bool
    guardrail_configured: bool = False
    # Intentionally no credentials/keys exposed
