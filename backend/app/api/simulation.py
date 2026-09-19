"""Simulation router — /simulation/*  (legacy unversioned paths)

The frontend calls these endpoints WITHOUT the /api/v1/ prefix.
They are preserved exactly so the Simulation page continues working.

Endpoints
─────────
POST /simulation/event   — inject a cloud event + trigger forecast refresh
GET  /simulation/status  — return current feeder state summary
POST /simulation/reset   — reset the feeder to baseline state
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.config import config
from app.services.forecast import forecast_service
from app.services.grid_intelligence import grid_service

logger = logging.getLogger("app.api.simulation")
router = APIRouter(tags=["simulation"])


# Track the last injected cloud event for status reporting
_last_cloud_event: dict | None = None


@router.post("/simulation/event")
def trigger_simulation_event(body: dict | None = None) -> dict:
    """Inject a cloud event and immediately refresh the forecast.

    Body parameters (match existing frontend contract)
    ───────────────────────────────────────────────────
    feeder_id:      str  (default: config.feeder_id)
    event_type:     str  e.g. "cloud_cover"
    severity_pct:   float  0-100
    duration_minutes: int  (converted to slots internally)
    """
    global _last_cloud_event
    body = body or {}
    feeder_id = body.get("feeder_id", config.feeder_id)
    severity_pct = float(body.get("severity_pct", 79.0))
    duration_minutes = int(body.get("duration_minutes", 150))
    duration_slots = max(1, duration_minutes // 30)

    cloud_event = {
        "active": True,
        "severity": severity_pct / 100.0,
        "start_slot": 2,
        "duration_slots": duration_slots,
    }
    _last_cloud_event = {**cloud_event, "feeder_id": feeder_id, "injected_at": datetime.now(timezone.utc).isoformat()}

    try:
        fcast = forecast_service.generate_forecast(feeder_id, cloud_event)
        state = grid_service.evaluate_feeder_state(feeder_id)
        return {
            "status": "ok",
            "event_injected": True,
            "feeder_id": feeder_id,
            "severity_pct": severity_pct,
            "duration_minutes": duration_minutes,
            "forecast_model": fcast.get("model"),
            "forecast_confidence": fcast.get("confidence"),
            "risk_level": state.get("risk_level"),
            "net_gap_kw": state.get("net_gap_kw"),
        }
    except Exception as exc:
        logger.error("Simulation event injection failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Simulation failed: {exc}")


@router.get("/simulation/status")
def simulation_status() -> dict:
    """Return the current feeder state as seen by the simulation."""
    feeder_id = (_last_cloud_event or {}).get("feeder_id", config.feeder_id)
    from app.core.store import get_latest_feeder_state, get_latest_forecast
    state = get_latest_feeder_state(feeder_id)
    fcast = get_latest_forecast(feeder_id)
    return {
        "feeder_id": feeder_id,
        "cloud_event_active": _last_cloud_event is not None,
        "last_cloud_event": _last_cloud_event,
        "feeder_state": {
            "risk_level": (state or {}).get("risk_level", "UNKNOWN"),
            "net_gap_kw": (state or {}).get("net_gap_kw", 0.0),
            "demand_kw": (state or {}).get("demand_kw", 0.0),
            "solar_kw": (state or {}).get("solar_kw", 0.0),
            "battery_soc_pct": (state or {}).get("battery_soc_pct", 80.0),
        } if state else None,
        "forecast_model": (fcast or {}).get("model"),
        "forecast_confidence": (fcast or {}).get("confidence"),
    }


@router.post("/simulation/reset")
def simulation_reset(body: dict | None = None) -> dict:
    """Reset the simulation: clear the cloud event and refresh baseline forecast."""
    global _last_cloud_event
    _last_cloud_event = None
    feeder_id = (body or {}).get("feeder_id", config.feeder_id)
    try:
        fcast = forecast_service.generate_forecast(feeder_id, cloud_event=None)
        state = grid_service.evaluate_feeder_state(feeder_id)
        return {
            "status": "ok",
            "reset": True,
            "feeder_id": feeder_id,
            "risk_level": state.get("risk_level"),
            "forecast_model": fcast.get("model"),
        }
    except Exception as exc:
        logger.warning("Reset forecast/state failed: %s", exc)
        return {"status": "ok", "reset": True, "feeder_id": feeder_id, "note": str(exc)}
