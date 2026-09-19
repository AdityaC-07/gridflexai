"""Flexibility pool router — /api/v1/pool

Endpoints
─────────
GET  /api/v1/pool?feeder_id=F01
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.services.flexibility import flexibility_service

logger = logging.getLogger("app.api.flexibility")
router = APIRouter(tags=["flexibility"])


@router.get("/pool")
def flexibility_pool(feeder_id: str) -> dict:
    try:
        return flexibility_service.get_pool(feeder_id)
    except Exception as exc:
        logger.error("Flexibility pool failed for %s: %s", feeder_id, exc)
        raise HTTPException(status_code=503, detail=str(exc))
