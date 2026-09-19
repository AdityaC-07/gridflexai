"""Telemetry router — /api/v1/telemetry/*

Endpoints
─────────
POST /api/v1/telemetry/{feeder_id}/ingest   — ingest a raw telemetry reading
GET  /api/v1/feeder/{feeder_id}/telemetry/current
GET  /api/v1/feeder/{feeder_id}/telemetry/history
GET  /api/v1/feeders

Note: the feeder/* endpoints live here for organisational clarity but mount
under the same /api/v1 prefix as the existing data_api.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query

from app.config import config
from app.core.store import (
    write_telemetry,
    get_latest_telemetry,
    get_recent_telemetry,
    MEMORY_TELEMETRY,
)

logger = logging.getLogger("app.api.telemetry")
router = APIRouter(tags=["telemetry"])


@router.get("/feeders")
def list_feeders() -> dict:
    return {"feeders": [config.feeder_id]}


@router.get("/feeder/{feeder_id}/telemetry/current")
def telemetry_current(feeder_id: str) -> dict:
    tel = get_latest_telemetry(feeder_id)
    if tel:
        return tel
    # Memory fallback (written by ingest when store is unavailable)
    mem = MEMORY_TELEMETRY.get(feeder_id, [])
    if mem:
        return mem[-1]
    raise HTTPException(status_code=404, detail=f"No telemetry for {feeder_id}")


@router.get("/feeder/{feeder_id}/telemetry/history")
def telemetry_history(
    feeder_id: str,
    hours: float = Query(default=6.0, ge=0.5, le=168.0),
) -> dict:
    limit = max(1, min(672, int(float(hours) * 2)))
    items = list(reversed(get_recent_telemetry(feeder_id, limit=limit)))
    if not items:
        items = MEMORY_TELEMETRY.get(feeder_id, [])[-limit:]
    return {"feeder_id": feeder_id, "hours": hours, "items": items}


@router.post("/telemetry/{feeder_id}/ingest")
def telemetry_ingest(feeder_id: str, body: dict) -> dict:
    item = dict(body)
    item["feeder_id"] = feeder_id
    item.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
    try:
        return write_telemetry(item)
    except Exception as exc:
        logger.warning("Store write failed (%s); using memory fallback.", exc)
        item["source"] = "memory"
        MEMORY_TELEMETRY.setdefault(feeder_id, []).append(item)
        return item
