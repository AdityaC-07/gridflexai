"""GridFlex Copilot router — /api/v1/copilot/*

Endpoints
─────────
POST /api/v1/copilot/query    — submit a question to the Bedrock Copilot
GET  /api/v1/copilot/status   — Bedrock availability and configuration
GET  /api/v1/copilot/ask      — legacy single-endpoint (kept for backward compat)

Security invariants
───────────────────
• The Copilot is READ-ONLY and SIMULATE-ONLY.
• It cannot dispatch resources, approve decisions, or modify safety thresholds.
• All tool calls are validated by the permission layer before execution.
• Bedrock credentials are NEVER returned in any response.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.config import config
from app.agents.gridflex_copilot.schemas import (
    CopilotQueryRequest,
    CopilotQueryResponse,
    CopilotStatusResponse,
)

logger = logging.getLogger("app.api.copilot")
router = APIRouter(tags=["copilot"])


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v1/copilot/query  — primary AI endpoint
# ─────────────────────────────────────────────────────────────────────────────

@router.post("/copilot/query", response_model=CopilotQueryResponse)
def copilot_query(request: CopilotQueryRequest) -> CopilotQueryResponse:
    """Submit a natural-language question to the GridFlex Reliability Copilot.

    The Copilot uses Amazon Bedrock (Converse API) with tool-use to:
      1. Gather live grid data from GridFlex services (read-only)
      2. Reason over the data with the configured foundation model
      3. Return a grounded, data-backed natural-language answer

    When Bedrock is unavailable (no credentials, BEDROCK_ENABLED=false),
    the endpoint returns a deterministic answer from live GridFlex data
    and clearly marks the response as a fallback.

    The Copilot WILL NOT:
      - Dispatch resources
      - Approve decisions
      - Modify safety constraints
      - Execute arbitrary code
    """
    try:
        from app.agents.gridflex_copilot.agent import run_copilot_query
        return run_copilot_query(request)
    except Exception as exc:
        logger.error("Copilot query failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Copilot error: {exc}",
        )


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/v1/copilot/status  — Bedrock availability probe
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/copilot/status", response_model=CopilotStatusResponse)
def copilot_status() -> CopilotStatusResponse:
    """Return the Bedrock configuration and credential availability.

    AWS secret keys are NEVER included in this response.
    The 'credentials_available' field is determined by attempting to resolve
    the boto3 credential chain — no actual Bedrock call is made.
    """
    from app.agents.gridflex_copilot.bedrock import credentials_available
    creds_ok = credentials_available()

    return CopilotStatusResponse(
        enabled=config.bedrock_enabled,
        provider="Amazon Bedrock",
        model=config.bedrock_model_id,
        region=config.aws_region or "ap-south-1",
        credentials_available=creds_ok,
        guardrail_configured=config.bedrock_guardrail_configured,
    )


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/v1/copilot/ask  — legacy endpoint (backward-compatible)
# ─────────────────────────────────────────────────────────────────────────────

class _LegacyRequest:
    pass


from pydantic import BaseModel


class _LegacyCopilotRequest(BaseModel):
    question: str
    feeder_id: str = "F01"
    event_id: str | None = None


@router.post("/copilot/ask")
def ask_copilot_legacy(request: _LegacyCopilotRequest) -> dict:
    """Legacy endpoint — delegates to the new Bedrock-backed /query endpoint.

    The response shape is enriched vs. the original MVP to include model info.
    """
    try:
        from app.agents.gridflex_copilot.agent import run_copilot_query
        result = run_copilot_query(
            CopilotQueryRequest(
                message=request.question,
                feeder_id=request.feeder_id,
                event_id=request.event_id,
            )
        )
        # Return enriched dict compatible with original callers
        return {
            "question": request.question,
            "answer": result.answer,
            "model": result.model,
            "provider": result.provider,
            "tools_used": [t.tool_name for t in result.tools_used],
            "sources": result.sources,
            "data_timestamp": result.data_timestamp,
            "mode": result.mode,
        }
    except Exception as exc:
        logger.error("Legacy copilot ask failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Copilot error: {exc}")
