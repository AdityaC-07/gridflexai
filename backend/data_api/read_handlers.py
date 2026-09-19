"""Read handlers for the Data/API service (DynamoDB -> stable JSON)."""
from __future__ import annotations

import logging

from shared import dynamo as db

logger = logging.getLogger("data-api-reads")


def _memory_telemetry(feeder_id: str) -> list[dict]:
    try:
        from data_api.write_handlers import MEMORY_TELEMETRY
        return MEMORY_TELEMETRY.get(feeder_id, [])
    except Exception:
        return []


def read_feeder_state(feeder_id: str) -> dict:
    try:
        state = db.get_latest_feeder_state(feeder_id)
    except Exception as exc:
        logger.warning("DynamoDB feeder-state read failed (%s); computing live.", exc)
        state = None
    if state and state.get("status") == "OK":
        return state
    # Fallback: compute live from forecast/telemetry (works offline after a refresh).
    from grid_intelligence.main import run_intelligence_cycle
    live = run_intelligence_cycle(feeder_id)
    if live.get("status") == "OK":
        return live
    if state:
        return state
    raise KeyError(f"No feeder state for {feeder_id}")


def read_current_telemetry(feeder_id: str) -> dict:
    try:
        tel = db.get_latest_telemetry(feeder_id)
    except Exception as exc:
        logger.warning("DynamoDB telemetry read failed (%s); checking memory.", exc)
        tel = None
    if tel:
        return tel
    mem = _memory_telemetry(feeder_id)
    if mem:
        return mem[-1]
    raise KeyError(f"No telemetry for {feeder_id}")


def read_telemetry_history(feeder_id: str, hours: float = 6.0) -> list[dict]:
    limit = max(1, min(672, int(float(hours) * 2)))
    try:
        items = list(reversed(db.get_recent_telemetry(feeder_id, limit=limit)))
        if items:
            return items
    except Exception as exc:
        logger.warning("DynamoDB telemetry history failed (%s); checking memory.", exc)
    mem = _memory_telemetry(feeder_id)
    return mem[-limit:] if mem else []


def read_forecast(feeder_id: str) -> dict:
    try:
        doc = db.get_latest_forecast(feeder_id)
    except Exception as exc:
        logger.warning("DynamoDB forecast read failed (%s); checking memory.", exc)
        doc = None
    if doc:
        return doc
    try:
        from forecast_service.main import LAST_FORECAST as _LF
        if feeder_id in _LF:
            return _LF[feeder_id]
    except Exception:
        pass
    raise KeyError(f"No forecast for {feeder_id}")


def read_latest_decision(feeder_id: str) -> dict:
    try:
        doc = db.get_latest_decision(feeder_id)
    except Exception as exc:
        logger.warning("DynamoDB decision read failed (%s); checking memory.", exc)
        doc = None
    if doc:
        return doc
    try:
        from optimization_service.main import MEMORY as _MEM
        cands = [d for d in _MEM.values() if d.get("feeder_id") == feeder_id]
        if cands:
            cands.sort(key=lambda d: str(d.get("created_at", "")), reverse=True)
            return cands[0]
    except Exception:
        pass
    raise KeyError(f"No decision for {feeder_id}")


def read_alerts(feeder_id: str) -> list[dict]:
    """Derive MVP alerts from feeder state (no separate alerts table)."""
    try:
        state = db.get_latest_feeder_state(feeder_id)
    except Exception:
        state = None
    alerts: list[dict] = []
    if not state or state.get("status") != "OK":
        return [{"severity": "INFO", "message": f"No live alerts for {feeder_id}; feeder state unavailable."}]
    risk = state.get("risk_level", "LOW")
    if state.get("has_gap"):
        alerts.append({"severity": "HIGH" if risk in ("HIGH", "CRITICAL") else "MEDIUM",
                       "message": f"Energy gap {state.get('net_gap_kw')} kW on {feeder_id} (risk {risk})."})
    if risk in ("HIGH", "CRITICAL"):
        alerts.append({"severity": "CRITICAL" if risk == "CRITICAL" else "HIGH",
                       "message": f"Feeder {feeder_id} {risk}: {state.get('recommended_action')}."})
    if float(state.get("battery_soc_pct", 100)) < 30:
        alerts.append({"severity": "MEDIUM", "message": f"Battery low ({state.get('battery_soc_pct')}%)."})
    return alerts or [{"severity": "INFO", "message": f"Feeder {feeder_id} normal (risk {risk})."}]


# ---------------- Reliability Events ----------------

def read_reliability_event(event_id: str) -> dict:
    """Read a specific reliability event by ID."""
    try:
        event = db.get_reliability_event(event_id)
        if not event:
            raise KeyError(f"Reliability event {event_id} not found")
        return event
    except Exception as exc:
        logger.warning("Failed to read reliability event %s: %s", event_id, exc)
        raise KeyError(f"Reliability event {event_id} not found")


def read_active_reliability_events(feeder_id: str | None = None) -> list[dict]:
    """Read active reliability events (PREDICTED, ACTIVE, APPROVED, DISPATCHED, VERIFYING)."""
    try:
        return db.get_active_reliability_events(feeder_id)
    except Exception as exc:
        logger.warning("Failed to read active reliability events: %s", exc)
        return []


def read_recent_reliability_events(feeder_id: str | None = None, limit: int = 10) -> list[dict]:
    """Read recent reliability events."""
    try:
        return db.get_recent_reliability_events(feeder_id, limit)
    except Exception as exc:
        logger.warning("Failed to read recent reliability events: %s", exc)
        return []


# ---------------- Flexibility Pool ----------------

def read_flexibility_pool(feeder_id: str) -> dict:
    """Read the flexibility pool for a feeder."""
    try:
        from grid_intelligence.pool_assembly import assemble_flexibility_pool

        # Get feeder state to determine gap
        state = db.get_latest_feeder_state(feeder_id)
        gap_kw = state.get("peak_gap_next_4h_kw", state.get("net_gap_kw", 0.0)) if state else 0.0

        pool = assemble_flexibility_pool(feeder_id, gap_kw)
        return pool
    except Exception as exc:
        logger.warning("Failed to read flexibility pool for %s: %s", feeder_id, exc)
        # Return empty pool on error
        return {
            "feeder_id": feeder_id,
            "resources": [],
            "total_available_kw": 0.0,
            "total_needed_kw": 0.0,
            "coverage_ratio": 0.0,
            "has_sufficient_coverage": False,
        }
