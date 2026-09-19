"""Reliability router — /api/v1/reliability/*

Endpoints
─────────
GET  /api/v1/reliability/{feeder_id}/metrics
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.services.reliability import reliability_service

logger = logging.getLogger("app.api.reliability")
router = APIRouter(tags=["reliability"])


@router.get("/reliability/{feeder_id}/metrics")
def reliability_metrics(feeder_id: str) -> dict:
    try:
        return reliability_service.calculate_metrics(feeder_id)
    except Exception as exc:
        logger.error("Reliability metrics failed for %s: %s", feeder_id, exc)
        raise HTTPException(status_code=503, detail=str(exc))
