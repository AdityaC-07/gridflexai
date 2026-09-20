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
    # Cold-start fallback: synthesize a telemetry reading from the latest
    # feeder state so the frontend never receives a 404 on first boot.
    # This is clearly marked source="synthesized" so consumers can detect it.
    from app.core.store import get_latest_feeder_state
    state = get_latest_feeder_state(feeder_id)
    if state and state.get("status") == "OK":
        synthetic = {
            "feeder_id": feeder_id,
            "timestamp": state.get("timestamp", datetime.now(timezone.utc).isoformat()),
            "demand_kw": float(state.get("demand_kw", 122.0)),
            "solar_kw": float(state.get("solar_kw", 118.0)),
            "battery_soc_pct": float(state.get("battery_soc_pct", 80.0)),
            "battery_soc_kwh": float(state.get("battery_soc_kwh", 160.0)),
            "grid_import_kw": float(state.get("grid_import_kw",
                max(0.0, state.get("demand_kw", 122.0)
                    - state.get("solar_kw", 118.0)))),
            "temperature_c": 30.0,
            "source": "synthesized",
        }
        # Persist so subsequent reads hit the store and this path is fast
        write_telemetry(synthetic)
        return synthetic
    raise HTTPException(status_code=404, detail=f"No telemetry for {feeder_id}")


@router.get("/feeder/{feeder_id}/telemetry/history")
def telemetry_history(
    feeder_id: str,
    hours: float = Query(default=6.0, ge=0.5, le=168.0),
) -> dict:
    limit = max(1, min(672, int(float(hours) * 2)))
    # get_recent_telemetry returns newest-first; reverse to oldest-first for charts
    items = list(reversed(get_recent_telemetry(feeder_id, limit=limit)))
    if not items:
        items = list(MEMORY_TELEMETRY.get(feeder_id, []))[-limit:]
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
