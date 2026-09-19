"""Reliability events router — /api/v1/events/*

Endpoints (PRESERVES all existing contracts)
─────────────────────────────────────────────
GET  /api/v1/events                          — list events (feeder_id?, active_only?)
GET  /api/v1/events/{event_id}               — get single event
POST /api/v1/events/{event_id}/approve       — operator approval
POST /api/v1/events/{event_id}/optimize      — trigger reliability budget optimization
POST /api/v1/events/simulate                 — LOCAL: trigger full event workflow in-process

The optimize endpoint previously made an HTTP call to localhost:8003.
In the unified process it calls optimization_service.optimize_reliability_event()
directly — no localhost HTTP required.
"""
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from app.services.reliability import reliability_service
from app.services.optimization import optimization_service

logger = logging.getLogger("app.api.events")
router = APIRouter(tags=["events"])


@router.get("/events")
def list_events(
    feeder_id: str | None = None,
    active_only: bool = False,
) -> dict:
    try:
        items = reliability_service.list_events(feeder_id, active_only)
        return {"events": items, "count": len(items)}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/events/{event_id}")
def event_detail(event_id: str) -> dict:
    event = reliability_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return event


@router.post("/events/{event_id}/approve")
def approve_event(event_id: str, body: dict | None = None) -> dict:
    try:
        return reliability_service.approve_event(
            event_id,
            (body or {}).get("approved_by", "operator"),
        )
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/events/{event_id}/optimize")
def optimize_event(event_id: str, body: dict | None = None) -> dict:
    """Trigger reliability budget optimization for an event.

    Previously this made an HTTP POST to localhost:8003.
    Now it calls optimization_service directly in-process.
    """
    feeder_id = (body or {}).get("feeder_id")
    if not feeder_id:
        raise HTTPException(status_code=422, detail="feeder_id required in request body")
    try:
        return optimization_service.optimize_reliability_event(event_id, feeder_id)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except Exception as exc:
        logger.error("Event optimization failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Optimization failed: {exc}")


@router.post("/events/simulate")
def simulate_event_workflow(body: dict | None = None) -> dict:
    """LOCAL DEVELOPMENT: trigger the complete reliability event workflow in-process.

    This endpoint runs the full pipeline:
      feeder state → event detection → flexibility pool → optimization →
      dispatch plan → simulated verification

    The response is clearly tagged as SIMULATION.

    Body parameters (all optional)
    ───────────────────────────────
    feeder_id:       str  (default: config.feeder_id)
    force_gap_kw:    float  force a specific energy gap (overrides live state)
    severity_pct:    float  cloud event severity 0-100 for forecast injection
    auto_verify:     bool   if True, also run simulated verification (default False)
    """
    from app.config import config
    from app.services.grid_intelligence import grid_service
    from app.services.forecast import forecast_service
    from app.services.event_detection import event_detection_service
    from app.core.store import write_feeder_state

    body = body or {}
    feeder_id = body.get("feeder_id", config.feeder_id)
    force_gap_kw = body.get("force_gap_kw")
    severity_pct = body.get("severity_pct", 79.0)
    auto_verify = bool(body.get("auto_verify", False))

    steps: dict = {}

    # 1. Generate forecast (optionally with a cloud event)
    try:
        cloud_event = None
        if severity_pct and float(severity_pct) > 0:
            cloud_event = {
                "active": True,
                "severity": float(severity_pct) / 100.0,
                "start_slot": 2,
                "duration_slots": 6,
            }
        fcast = forecast_service.generate_forecast(feeder_id, cloud_event)
        steps["forecast"] = {"status": "ok", "model": fcast.get("model"), "confidence": fcast.get("confidence")}
    except Exception as exc:
        steps["forecast"] = {"status": "error", "detail": str(exc)}

    # 2. Evaluate feeder state (live intelligence cycle)
    try:
        state = grid_service.evaluate_feeder_state(feeder_id)
        if force_gap_kw is not None:
            # Override gap fields so event detection can fire even in low-load demos
            state["net_gap_kw"] = float(force_gap_kw)
            state["peak_gap_next_4h_kw"] = float(force_gap_kw)
            state["gross_gap_kw"] = float(force_gap_kw)
            state["has_gap"] = float(force_gap_kw) > config.gap_threshold_kw
            state["risk_level"] = "HIGH" if float(force_gap_kw) >= 20 else state.get("risk_level", "LOW")
            write_feeder_state(state)
        steps["feeder_state"] = {
            "status": "ok",
            "risk_level": state.get("risk_level"),
            "net_gap_kw": state.get("net_gap_kw"),
        }
    except Exception as exc:
        state = None
        steps["feeder_state"] = {"status": "error", "detail": str(exc)}

    # 3. Event detection
    event = None
    try:
        if state:
            event = event_detection_service.detect_from_state(feeder_id, state, fcast if "forecast" in steps else None)
        steps["event_detection"] = {
            "status": "ok",
            "event_created": event is not None,
            "event_id": (event or {}).get("event_id"),
        }
    except Exception as exc:
        steps["event_detection"] = {"status": "error", "detail": str(exc)}

    # 4. Optimize (if event was created)
    opt_result = None
    if event and event.get("event_id"):
        try:
            opt_result = optimization_service.optimize_reliability_event(
                event["event_id"], feeder_id
            )
            steps["optimization"] = {
                "status": "ok",
                "total_dispatch_kw": (opt_result.get("optimization_result") or {}).get("total_dispatch_kw"),
            }
        except Exception as exc:
            steps["optimization"] = {"status": "error", "detail": str(exc)}

    # 5. Simulated verification (if auto_verify requested)
    verify_result = None
    if auto_verify and event and opt_result:
        try:
            # Must be in DISPATCHED state for verification; transition via store
            from app.core.store import get_reliability_event, write_reliability_event
            ev = get_reliability_event(event["event_id"])
            if ev:
                ev["status"] = "DISPATCHED"
                write_reliability_event(ev)
            verify_result = reliability_service.verify_event(event["event_id"])
            steps["verification"] = {"status": "ok", "verified": True}
        except Exception as exc:
            steps["verification"] = {"status": "error", "detail": str(exc)}

    return {
        "simulation": True,
        "feeder_id": feeder_id,
        "steps": steps,
        "event_id": (event or {}).get("event_id"),
        "event": event,
        "optimization_result": opt_result,
        "verification_result": verify_result,
        "note": (
            "This is a LOCAL simulation. No real grid actions were taken. "
            "Operator approval is still required before any dispatch."
        ),
    }
