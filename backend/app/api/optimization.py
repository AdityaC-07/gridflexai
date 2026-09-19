"""Optimization router — /api/v1/optimization/*

Endpoints
─────────
GET  /api/v1/optimization/{feeder_id}/latest
POST /api/v1/optimization/{feeder_id}/run
POST /api/v1/optimization/{decision_id}/approve

All optimisation logic is deterministic and runs in-process.
Manual operator approval is always required (policy layer enforces this).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.services.optimization import optimization_service

logger = logging.getLogger("app.api.optimization")
router = APIRouter(tags=["optimization"])


@router.get("/optimization/{feeder_id}/latest")
def opt_latest(feeder_id: str) -> dict:
    doc = optimization_service.get_latest_decision(feeder_id)
    if doc:
        return doc
    raise HTTPException(status_code=404, detail=f"No decision for {feeder_id}")


@router.post("/optimization/{feeder_id}/run")
def opt_run(feeder_id: str) -> dict:
    try:
        return optimization_service.generate_dispatch_plan(feeder_id)
    except RuntimeError as exc:
        raise HTTPException(
            status_code=404 if "refresh forecast" in str(exc) or "No feeder" in str(exc) else 503,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("Optimization run failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Optimization failed: {exc}")


@router.post("/optimization/{decision_id}/approve")
def opt_approve(decision_id: str, body: dict | None = None) -> dict:
    try:
        return optimization_service.approve_decision(decision_id, body)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Decision approval failed: %s", exc)
        raise HTTPException(status_code=503, detail=str(exc))
