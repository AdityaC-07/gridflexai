"""Forecast router — /api/v1/forecast/*

Endpoints
─────────
GET  /api/v1/forecast/{feeder_id}
POST /api/v1/forecast/{feeder_id}/refresh
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.services.forecast import forecast_service

logger = logging.getLogger("app.api.forecast")
router = APIRouter(tags=["forecast"])


@router.get("/forecast/{feeder_id}")
def get_forecast(feeder_id: str) -> dict:
    doc = forecast_service.get_forecast(feeder_id)
    if doc:
        return doc
    raise HTTPException(
        status_code=404,
        detail=f"No forecast for {feeder_id}. POST /api/v1/forecast/{feeder_id}/refresh first.",
    )


@router.post("/forecast/{feeder_id}/refresh")
def refresh_forecast(feeder_id: str, body: dict | None = None) -> dict:
    try:
        return forecast_service.generate_forecast(feeder_id, (body or {}).get("cloud_event"))
    except Exception as exc:
        logger.error("Forecast refresh failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Forecast failed: {exc}")
