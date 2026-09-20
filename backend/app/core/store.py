"""Storage abstraction layer.

In LOCAL mode  → all data lives in thread-safe in-memory Python dicts.
In AWS mode    → delegates to shared.dynamo (DynamoDB).

Service code never imports boto3 or shared.dynamo directly — it calls the
functions in this module.  The same function signatures work in both modes,
so the service layer is completely agnostic about the underlying store.

Design rules
────────────
• No network calls in local mode (DynamoDB client is never created).
• All write functions return the item they wrote (mirrors DynamoDB behaviour).
• All query functions return [] or None when no data exists (never raise).
• Thread safety: use a simple RLock around the in-memory dicts.  FastAPI
  workers run in the same event loop (single process / single thread for
  uvicorn --reload dev mode), so a plain dict is already safe, but the
  RLock guard keeps things correct if workers are added later.
"""
from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Any

from app.config import config

_lock = threading.RLock()

# ── In-memory stores (local mode) ────────────────────────────────────────────
_telemetry: dict[str, list[dict]] = {}        # feeder_id → [item, …] newest-first
_forecasts: dict[str, dict] = {}              # feeder_id → latest forecast doc
_feeder_state: dict[str, dict] = {}           # feeder_id → latest state doc
_decisions: dict[str, dict] = {}              # decision_id → decision doc
_battery: dict[str, dict] = {}               # feeder_id → battery state
_reliability_events: dict[str, dict] = {}    # event_id → event doc
_flexibility_pool: dict[str, dict] = {}      # resource_id → resource doc

_ACTIVE_STATUSES = {"PREDICTED", "ACTIVE", "OPERATOR_APPROVED", "DISPATCHED", "VERIFYING"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ─────────────────────────────────────────────────────────────────────────────
# Telemetry
# ─────────────────────────────────────────────────────────────────────────────

def write_telemetry(item: dict[str, Any]) -> dict[str, Any]:
    if config.is_aws:
        from shared import dynamo as db
        return db.write_telemetry(item)
    with _lock:
        fid = item.get("feeder_id", "F01")
        _telemetry.setdefault(fid, []).insert(0, item)
        _telemetry[fid] = _telemetry[fid][:672]   # keep ≤ 2 weeks at 30-min slots
    return item


def get_recent_telemetry(feeder_id: str, limit: int = 96) -> list[dict[str, Any]]:
    if config.is_aws:
        from shared import dynamo as db
        try:
            return db.get_recent_telemetry(feeder_id, limit)
        except Exception:
            return []
    with _lock:
        return list(_telemetry.get(feeder_id, []))[:limit]


def get_latest_telemetry(feeder_id: str) -> dict[str, Any] | None:
    rows = get_recent_telemetry(feeder_id, 1)
    return rows[0] if rows else None


# ─────────────────────────────────────────────────────────────────────────────
# Forecasts
# ─────────────────────────────────────────────────────────────────────────────

def write_forecast(item: dict[str, Any]) -> dict[str, Any]:
    if config.is_aws:
        from shared import dynamo as db
        return db.write_forecast(item)
    with _lock:
        _forecasts[item.get("feeder_id", "F01")] = item
    return item


def get_latest_forecast(feeder_id: str) -> dict[str, Any] | None:
    if config.is_aws:
        from shared import dynamo as db
        try:
            return db.get_latest_forecast(feeder_id)
        except Exception:
            return None
    with _lock:
        return _forecasts.get(feeder_id)


# ─────────────────────────────────────────────────────────────────────────────
# Feeder state
# ─────────────────────────────────────────────────────────────────────────────

def write_feeder_state(item: dict[str, Any]) -> dict[str, Any]:
    if config.is_aws:
        from shared import dynamo as db
        return db.write_feeder_state(item)
    with _lock:
        _feeder_state[item.get("feeder_id", "F01")] = item
    return item


def get_latest_feeder_state(feeder_id: str) -> dict[str, Any] | None:
    if config.is_aws:
        from shared import dynamo as db
        try:
            return db.get_latest_feeder_state(feeder_id)
        except Exception:
            return None
    with _lock:
        return _feeder_state.get(feeder_id)


# ─────────────────────────────────────────────────────────────────────────────
# Battery
# ─────────────────────────────────────────────────────────────────────────────

def get_battery_state(feeder_id: str, default_soc_pct: float = 80.0) -> dict[str, Any]:
    if config.is_aws:
        from shared import dynamo as db
        try:
            return db.get_battery_state(feeder_id, default_soc_pct)
        except Exception:
            pass
    with _lock:
        if feeder_id in _battery:
            return _battery[feeder_id]
    capacity = config.battery_capacity_kwh
    return {
        "feeder_id": feeder_id,
        "soc_pct": default_soc_pct,
        "soc_kwh": round(capacity * default_soc_pct / 100.0, 2),
        "capacity_kwh": capacity,
        "updated_at": _now(),
        "source": "default",
    }


def write_battery_state(item: dict[str, Any]) -> dict[str, Any]:
    if config.is_aws:
        from shared import dynamo as db
        return db.write_battery_state(item)
    with _lock:
        _battery[item.get("feeder_id", "F01")] = item
    return item


# ─────────────────────────────────────────────────────────────────────────────
# Decisions
# ─────────────────────────────────────────────────────────────────────────────

def write_decision(item: dict[str, Any]) -> dict[str, Any]:
    if config.is_aws:
        from shared import dynamo as db
        try:
            db.write_decision(item)
        except Exception:
            pass
    with _lock:
        _decisions[item["decision_id"]] = item
    return item


def get_decision(decision_id: str, feeder_id: str | None = None) -> dict[str, Any] | None:
    if config.is_aws:
        from shared import dynamo as db
        try:
            doc = db.get_decision(decision_id, feeder_id)
            if doc:
                return doc
        except Exception:
            pass
    with _lock:
        return _decisions.get(decision_id)


def get_latest_decision(feeder_id: str) -> dict[str, Any] | None:
    if config.is_aws:
        from shared import dynamo as db
        try:
            doc = db.get_latest_decision(feeder_id)
            if doc:
                return doc
        except Exception:
            pass
    with _lock:
        cands = [d for d in _decisions.values() if d.get("feeder_id") == feeder_id]
        if not cands:
            return None
        cands.sort(key=lambda d: str(d.get("created_at", "")), reverse=True)
        return cands[0]


# ─────────────────────────────────────────────────────────────────────────────
# Reliability events
# ─────────────────────────────────────────────────────────────────────────────

def write_reliability_event(item: dict[str, Any]) -> dict[str, Any]:
    if config.is_aws:
        from shared import dynamo as db
        try:
            db.write_reliability_event(item)
        except Exception:
            pass
    with _lock:
        # Use composite key: feeder_id + timestamp
        fid = item.get("feeder_id", "F01")
        ts = item.get("timestamp", _now())
        key = f"{fid}#{ts}"
        _reliability_events[key] = item
    return item


def get_reliability_event(event_id: str) -> dict[str, Any] | None:
    """Get event by event_id - requires scan since event_id is not primary key."""
    if config.is_aws:
        from shared import dynamo as db
        try:
            doc = db.get_reliability_event(event_id)
            if doc:
                return doc
        except Exception:
            pass
    with _lock:
        # Scan through events to find by event_id
        for event in _reliability_events.values():
            if event.get("event_id") == event_id:
                return event
        return None


def get_active_reliability_events(feeder_id: str | None = None) -> list[dict[str, Any]]:
    if config.is_aws:
        from shared import dynamo as db
        try:
            return db.get_active_reliability_events(feeder_id)
        except Exception:
            pass
    with _lock:
        events = list(_reliability_events.values())
    events = [e for e in events if e.get("status") in _ACTIVE_STATUSES]
    if feeder_id:
        events = [e for e in events if e.get("feeder_id") == feeder_id]
    # Sort by timestamp (most recent first)
    events.sort(key=lambda e: str(e.get("timestamp", "")), reverse=True)
    return events


def get_recent_reliability_events(feeder_id: str | None = None, limit: int = 10) -> list[dict[str, Any]]:
    if config.is_aws:
        from shared import dynamo as db
        try:
            return db.get_recent_reliability_events(feeder_id, limit)
        except Exception:
            pass
    with _lock:
        events = list(_reliability_events.values())
    if feeder_id:
        events = [e for e in events if e.get("feeder_id") == feeder_id]
    # Sort by timestamp (most recent first)
    events.sort(key=lambda e: str(e.get("timestamp", "")), reverse=True)
    return events[:limit]


# ─────────────────────────────────────────────────────────────────────────────
# Flexibility pool
# ─────────────────────────────────────────────────────────────────────────────

def write_flexibility_resource(item: dict[str, Any]) -> dict[str, Any]:
    if config.is_aws:
        from shared import dynamo as db
        try:
            db.write_flexibility_resource(item)
        except Exception:
            pass
    with _lock:
        _flexibility_pool[item["resource_id"]] = item
    return item


def get_flexibility_resource(resource_id: str) -> dict[str, Any] | None:
    if config.is_aws:
        from shared import dynamo as db
        try:
            doc = db.get_flexibility_resource(resource_id)
            if doc:
                return doc
        except Exception:
            pass
    with _lock:
        return _flexibility_pool.get(resource_id)


def get_feeder_flexibility_pool(feeder_id: str) -> list[dict[str, Any]]:
    if config.is_aws:
        from shared import dynamo as db
        try:
            return db.get_feeder_flexibility_pool(feeder_id)
        except Exception:
            pass
    with _lock:
        return [
            r for r in _flexibility_pool.values()
            if r.get("feeder_id") == feeder_id and r.get("enrolled", True)
        ]


# ─────────────────────────────────────────────────────────────────────────────
# In-memory telemetry fallback (write path used when DynamoDB is unavailable)
# ─────────────────────────────────────────────────────────────────────────────

# Kept as module-level dict so it persists across requests (same process).
MEMORY_TELEMETRY: dict[str, list] = {}


def store_available() -> bool:
    """Return True if the configured store is reachable (always True for local)."""
    if config.is_local:
        return True
    from shared import dynamo as db
    return db.dynamo_available()
