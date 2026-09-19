"""Local DynamoDB patch for APP_MODE=local.

In local mode the existing service modules (forecast_service, grid_intelligence,
optimization_service, etc.) all import ``shared.dynamo`` and call functions like
``db.get_latest_forecast()``, ``db.write_feeder_state()``, etc.

Rather than modifying those battle-tested modules, this module monkey-patches
``shared.dynamo`` at startup so that every DynamoDB call is silently redirected
to the unified in-memory store (``app.core.store``).

Result:
  ─ No DynamoDB credentials required in local mode.
  ─ All service modules share the SAME in-memory state.
  ─ No "no AWS credentials found" warning logs in local mode.
  ─ The existing modules remain unchanged for production use.

This patch is applied ONLY when APP_MODE=local.  When APP_MODE=aws, shared.dynamo
continues to work normally using the real DynamoDB SDK.

Call ``apply_patch()`` once at application startup (called from app/main.py).
"""
from __future__ import annotations

import logging
from typing import Any

logger = logging.getLogger("app.core.local_dynamo_patch")

_patched = False


def apply_patch() -> None:
    """Replace shared.dynamo functions with in-memory implementations."""
    global _patched
    if _patched:
        return

    from app.core import store

    import shared.dynamo as _dynamo  # noqa: F401  (side-effect: module is loaded)

    # ── Patch each public function ─────────────────────────────────────────
    _dynamo.write_telemetry = store.write_telemetry
    _dynamo.get_recent_telemetry = store.get_recent_telemetry
    _dynamo.get_latest_telemetry = store.get_latest_telemetry

    _dynamo.write_forecast = store.write_forecast
    _dynamo.get_latest_forecast = store.get_latest_forecast

    _dynamo.write_feeder_state = store.write_feeder_state
    _dynamo.get_latest_feeder_state = store.get_latest_feeder_state

    _dynamo.get_battery_state = store.get_battery_state
    _dynamo.write_battery_state = store.write_battery_state

    _dynamo.write_decision = store.write_decision
    _dynamo.get_decision = store.get_decision
    _dynamo.get_latest_decision = store.get_latest_decision

    _dynamo.write_reliability_event = store.write_reliability_event
    _dynamo.get_reliability_event = store.get_reliability_event
    _dynamo.get_active_reliability_events = store.get_active_reliability_events
    _dynamo.get_recent_reliability_events = store.get_recent_reliability_events

    _dynamo.write_flexibility_resource = store.write_flexibility_resource
    _dynamo.get_flexibility_resource = store.get_flexibility_resource
    _dynamo.get_feeder_flexibility_pool = store.get_feeder_flexibility_pool

    _dynamo.dynamo_available = lambda: True  # Always "available" in local mode

    _patched = True
    logger.info(
        "Local DynamoDB patch applied: all shared.dynamo calls → in-memory store. "
        "No AWS credentials required."
    )
