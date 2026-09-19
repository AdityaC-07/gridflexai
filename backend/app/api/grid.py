"""Grid intelligence router — /api/v1/feeder/{feeder_id}/state, /api/v1/alerts/*

Endpoints
─────────
GET  /api/v1/feeder/{feeder_id}/state
GET  /api/v1/alerts/{feeder_id}
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.services.grid_intelligence import grid_service
from app.core.store import get_latest_feeder_state

logger = logging.getLogger("app.api.grid")
router = APIRouter(tags=["grid"])


@router.get("/feeder/{feeder_id}/state")
def feeder_state(feeder_id: str) -> dict:
    # Try cached state first; compute live if stale or missing
    state = get_latest_feeder_state(feeder_id)
    if state and state.get("status") == "OK":
        return state
    try:
        live = grid_service.evaluate_feeder_state(feeder_id)
        if live.get("status") == "OK":
            return live
        if state:
            return state
    except Exception as exc:
        if state:
            return state
        raise HTTPException(status_code=503, detail=f"Intelligence cycle failed: {exc}")
    raise HTTPException(status_code=404, detail=f"No feeder state for {feeder_id}")


@router.get("/alerts/{feeder_id}")
def alerts(feeder_id: str) -> dict:
    state = get_latest_feeder_state(feeder_id)
    alert_list: list[dict] = []
    if not state or state.get("status") != "OK":
        return {"feeder_id": feeder_id, "alerts": [
            {"severity": "INFO", "message": f"No live alerts for {feeder_id}; feeder state unavailable."}
        ]}
    risk = state.get("risk_level", "LOW")
    if state.get("has_gap"):
        alert_list.append({
            "severity": "HIGH" if risk in ("HIGH", "CRITICAL") else "MEDIUM",
            "message": f"Energy gap {state.get('net_gap_kw')} kW on {feeder_id} (risk {risk}).",
        })
    if risk in ("HIGH", "CRITICAL"):
        alert_list.append({
            "severity": "CRITICAL" if risk == "CRITICAL" else "HIGH",
            "message": f"Feeder {feeder_id} {risk}: {state.get('recommended_action')}.",
        })
    if float(state.get("battery_soc_pct", 100)) < 30:
        alert_list.append({"severity": "MEDIUM", "message": f"Battery low ({state.get('battery_soc_pct')}%)."})
    return {"feeder_id": feeder_id, "alerts": alert_list or [
        {"severity": "INFO", "message": f"Feeder {feeder_id} normal (risk {risk})."}
    ]}
