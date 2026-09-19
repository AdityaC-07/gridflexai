"""Data/API Service — the ONLY frontend-facing backend service."""
from __future__ import annotations

import logging
import os
import sys

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from data_api import read_handlers as reads  # noqa: E402
from data_api import write_handlers as writes  # noqa: E402
from reliability_metrics import compute_reliability_metrics  # noqa: E402
from shared.config import settings  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("data-api")

app = FastAPI(title="GridFlex Data/API Service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _not_found(exc: KeyError) -> HTTPException:
    return HTTPException(status_code=404, detail=str(exc))


def _unavailable(exc: Exception) -> HTTPException:
    return HTTPException(status_code=503, detail=str(exc))


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "data-api"}


@app.get("/api/v1/feeders")
def feeders() -> dict:
    return {"feeders": [settings.feeder_id]}


@app.get("/api/v1/feeder/{feeder_id}/state")
def feeder_state(feeder_id: str) -> dict:
    try:
        return reads.read_feeder_state(feeder_id)
    except KeyError as exc:
        raise _not_found(exc)
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.get("/api/v1/feeder/{feeder_id}/telemetry/current")
def telemetry_current(feeder_id: str) -> dict:
    try:
        return reads.read_current_telemetry(feeder_id)
    except KeyError as exc:
        raise _not_found(exc)
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.get("/api/v1/feeder/{feeder_id}/telemetry/history")
def telemetry_history(feeder_id: str, hours: float = Query(default=6.0, ge=0.5, le=168.0)) -> dict:
    try:
        return {"feeder_id": feeder_id, "hours": hours, "items": reads.read_telemetry_history(feeder_id, hours)}
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.get("/api/v1/forecast/{feeder_id}")
def forecast(feeder_id: str) -> dict:
    try:
        return reads.read_forecast(feeder_id)
    except KeyError as exc:
        raise _not_found(exc)
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.get("/api/v1/optimization/{feeder_id}/latest")
def opt_latest(feeder_id: str) -> dict:
    try:
        return reads.read_latest_decision(feeder_id)
    except KeyError as exc:
        raise _not_found(exc)
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.post("/api/v1/optimization/{feeder_id}/run")
def opt_run(feeder_id: str) -> dict:
    try:
        return writes.trigger_optimization_run(feeder_id)
    except RuntimeError as exc:
        raise _not_found(exc) if "No feeder" in str(exc) or "refresh forecast" in str(exc) else _unavailable(exc)
    except Exception as exc:
        raise _unavailable(exc)


@app.post("/api/v1/forecast/{feeder_id}/refresh")
def forecast_refresh(feeder_id: str) -> dict:
    try:
        return writes.trigger_forecast_refresh(feeder_id)
    except Exception as exc:
        raise _unavailable(exc)


@app.post("/api/v1/optimization/{decision_id}/approve")
def opt_approve(decision_id: str, body: dict | None = None) -> dict:
    try:
        return writes.approve_decision(decision_id, (body or {}).get("feeder_id"), (body or {}).get("approved_by", "operator"))
    except HTTPException:
        raise
    except Exception as exc:
        raise _unavailable(exc)


@app.post("/api/v1/telemetry/{feeder_id}/ingest")
def telemetry_ingest(feeder_id: str, body: dict) -> dict:
    try:
        return writes.ingest_telemetry({**body, "feeder_id": feeder_id})
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.get("/api/v1/reliability/{feeder_id}/metrics")
def reliability(feeder_id: str) -> dict:
    """MVP: derive baseline vs GridFlex from latest decision + feeder state."""
    try:
        decision = reads.read_latest_decision(feeder_id)
    except (KeyError, RuntimeError):
        decision = None
    gridflex_kw = (decision or {}).get("optimization", {}).get("unserved_kw", [0.0] * 8)
    # Baseline: no intelligent dispatch -> full 4h gap unserved
    try:
        state = reads.read_feeder_state(feeder_id)
        gap = float(state.get("peak_gap_next_4h_kw", state.get("net_gap_kw", 0.0)))
    except (KeyError, RuntimeError):
        gap = 0.0
    baseline_kw = [gap] * len(gridflex_kw) if gridflex_kw else [gap] * 8
    metrics = compute_reliability_metrics(
        baseline_kw, gridflex_kw or [0.0] * 8,
        battery_energy_used_kwh=float((decision or {}).get("optimization", {}).get("battery_energy_used_kwh", 0.0)),
    )
    return {"feeder_id": feeder_id, **metrics}


@app.get("/api/v1/alerts/{feeder_id}")
def alerts(feeder_id: str) -> dict:
    return {"feeder_id": feeder_id, "alerts": reads.read_alerts(feeder_id)}


# ---------------- Reliability Events endpoints ----------------

@app.get("/api/v1/events")
def events(feeder_id: str | None = None, active_only: bool = False) -> dict:
    """List reliability events, optionally filtered by feeder_id and active status."""
    try:
        if active_only:
            items = reads.read_active_reliability_events(feeder_id)
        else:
            items = reads.read_recent_reliability_events(feeder_id)
        return {"events": items, "count": len(items)}
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.get("/api/v1/events/{event_id}")
def event_detail(event_id: str) -> dict:
    """Get detailed information about a specific reliability event."""
    try:
        event = reads.read_reliability_event(event_id)
        if not event:
            raise _not_found(KeyError(f"Event {event_id} not found"))
        return event
    except KeyError as exc:
        raise _not_found(exc)
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.post("/api/v1/events/{event_id}/approve")
def approve_event(event_id: str, body: dict | None = None) -> dict:
    """Approve a reliability event for dispatch."""
    try:
        return writes.approve_reliability_event(event_id, (body or {}).get("approved_by", "operator"))
    except KeyError as exc:
        raise _not_found(exc)
    except RuntimeError as exc:
        raise _unavailable(exc)


@app.post("/api/v1/events/{event_id}/optimize")
def optimize_event(event_id: str, body: dict) -> dict:
    """Trigger reliability budget optimization for an event."""
    try:
        return writes.trigger_event_optimization(event_id, body.get("feeder_id"))
    except RuntimeError as exc:
        raise _unavailable(exc)


# ---------------- Flexibility Pool endpoints ----------------

@app.get("/api/v1/pool")
def flexibility_pool(feeder_id: str) -> dict:
    """Get the current flexibility pool for a feeder."""
    try:
        return reads.read_flexibility_pool(feeder_id)
    except KeyError as exc:
        raise _not_found(exc)
    except RuntimeError as exc:
        raise _unavailable(exc)
