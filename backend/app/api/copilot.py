"""GridFlex Copilot router — /api/v1/copilot/*

Endpoints
─────────
POST /api/v1/copilot/ask

The Copilot is a READ-ONLY explanation and simulation agent.
It MUST NOT dispatch resources, bypass operator approval, or modify
safety constraints.  It reads live state through the copilot tool
interface and generates natural-language explanations.

In the current MVP the explanation engine is rule-based.  The tool
interface defined in app/agents/gridflex_copilot/ is designed so that
a future LLM backend (e.g. Claude via Bedrock) can be wired in
transparently by changing only the agent layer — not the tools.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.agents.gridflex_copilot.tools import CopilotToolkit

logger = logging.getLogger("app.api.copilot")
router = APIRouter(tags=["copilot"])


class CopilotRequest(BaseModel):
    question: str
    feeder_id: str = "F01"
    event_id: str | None = None


@router.post("/copilot/ask")
def ask_copilot(request: CopilotRequest) -> dict:
    """Ask the GridFlex Copilot a question about the current grid state.

    The copilot may:
    - explain feeder risk and stress index
    - describe active reliability events
    - summarise the flexibility pool
    - explain optimization decisions
    - answer 'what if' scenario questions (read-only simulation)

    The copilot will NEVER:
    - issue dispatch commands
    - bypass operator approval
    - modify safety rules or battery reserve constraints
    """
    try:
        from app.agents.gridflex_copilot.agent import answer_question
        result = answer_question(
            question=request.question,
            feeder_id=request.feeder_id,
            event_id=request.event_id,
        )
        return result
    except Exception as exc:
        logger.error("Copilot failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Copilot error: {exc}")
