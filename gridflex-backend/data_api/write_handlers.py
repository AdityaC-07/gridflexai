"""Write handlers for the Data/API service (manual triggers + approvals)."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from shared import dynamo as db

logger = logging.getLogger("data-api-writes")

# In-memory fallback so the demo/e2e works even when DynamoDB is unreachable.
# Entries are marked source="memory" to make the fallback explicit.
MEMORY_TELEMETRY: dict[str, list] = {}


def trigger_forecast_refresh(feeder_id: str) -> dict:
    """Run the forecast cycle in-process so the demo works without the scheduler."""
    from forecast_service.main import run_forecast_cycle
    return run_forecast_cycle(feeder_id)


def trigger_optimization_run(feeder_id: str) -> dict:
    from optimization_service.main import run_optimization_cycle
    return run_optimization_cycle(feeder_id)


def approve_decision(decision_id: str, feeder_id: str | None = None, approved_by: str = "operator") -> dict:
    from optimization_service.main import approve_opt
    return approve_opt(decision_id, {"feeder_id": feeder_id, "approved_by": approved_by})


def ingest_telemetry(item: dict) -> dict:
    item = dict(item)
    item.setdefault("timestamp", datetime.now(timezone.utc).isoformat())
    try:
        return db.write_telemetry(item)
    except Exception as exc:
        logger.warning("DynamoDB telemetry write failed (%s); using memory fallback.", exc)
        item["source"] = "memory"
        MEMORY_TELEMETRY.setdefault(item.get("feeder_id", "F01"), []).append(item)
        return item
