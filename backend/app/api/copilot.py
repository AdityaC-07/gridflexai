"""GridFlex Copilot router — /api/v1/copilot/*

Endpoints
─────────
POST /api/v1/copilot/query    — submit a question to the Groq Copilot
GET  /api/v1/copilot/status   — Groq availability and configuration
GET  /api/v1/copilot/ask      — legacy single-endpoint (kept for backward compat)

Security invariants
───────────────────
• The Copilot is READ-ONLY and SIMULATE-ONLY.
• It cannot dispatch resources, approve decisions, or modify safety thresholds.
• All tool calls are validated by the permission layer before execution.
• Groq API keys are NEVER returned in any response.
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

    The Copilot uses the Groq Chat Completions API with tool-use to:
      1. Gather live grid data from GridFlex services (read-only)
      2. Reason over the data with the configured foundation model
      3. Return a grounded, data-backed natural-language answer

    When Groq is unavailable (no API key, GROQ_ENABLED=false),
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
# GET /api/v1/copilot/status  — Groq availability probe
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/copilot/status", response_model=CopilotStatusResponse)
def copilot_status() -> CopilotStatusResponse:
    """Return the Groq configuration and API-key availability.

    API keys are NEVER included in this response.
    The 'credentials_available' field reports whether GROQ_API_KEY is set —
    no actual Groq call is made.
    """
    from app.agents.gridflex_copilot.llm import api_key_available
    creds_ok = api_key_available()

    return CopilotStatusResponse(
        enabled=config.groq_enabled and creds_ok,
        provider="Groq",
        model=config.groq_model,
        region="Groq Cloud (global)",
        credentials_available=creds_ok,
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
    """Legacy endpoint — delegates to the new Groq-backed /query endpoint.

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
