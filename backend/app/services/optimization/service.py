"""Optimization service — direct Python API over the existing optimization modules.

DETERMINISM GUARANTEE
─────────────────────
All optimisation logic (LP, heuristic, policy, reliability budget) is
unchanged and deterministic.  This module only wires them together through
the unified store instead of requiring an HTTP round-trip.
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from app.config import config
from app.core.store import (
    get_latest_feeder_state,
    get_latest_forecast,
    get_battery_state,
    write_decision,
    get_decision,
    get_latest_decision,
    write_reliability_event,
    get_reliability_event,
)

logger = logging.getLogger("app.services.optimization")

# In-memory decision cache (same semantics as the original MEMORY dict)
MEMORY: dict[str, dict] = {}


class OptimizationService:
    """Orchestrates LP / heuristic optimization and policy checks."""

    def generate_dispatch_plan(self, feeder_id: str) -> dict:
        """Run a full optimization cycle in-process.

        Steps
        ─────
        1. Read feeder state + forecast from store
        2. Compute gap & flexibility
        3. Run LP optimizer (heuristic fallback on failure)
        4. Apply policy layer
        5. Generate explanation
        6. Persist decision
        7. Return decision dict

        This is the single-process equivalent of calling
        POST /optimization/{feeder_id}/run on the old optimization service.
        """
        from optimization_service.main import run_optimization_cycle
        decision = run_optimization_cycle(feeder_id)
        # Mirror to unified store
        write_decision(decision)
        MEMORY[decision["decision_id"]] = decision
        return decision

    def approve_decision(self, decision_id: str, body: dict | None = None) -> dict:
        """Mark a decision APPROVED (operator gate, always manual)."""
        from optimization_service.main import approve_opt
        result = approve_opt(decision_id, body or {})
        # Mirror approval to unified store
        if result:
            write_decision(result)
            MEMORY[decision_id] = result
        return result

    def get_decision(self, decision_id: str, feeder_id: str | None = None) -> dict | None:
        if decision_id in MEMORY:
            return MEMORY[decision_id]
        return get_decision(decision_id, feeder_id)

    def get_latest_decision(self, feeder_id: str) -> dict | None:
        doc = get_latest_decision(feeder_id)
        if doc:
            return doc
        # In-memory fallback
        cands = [d for d in MEMORY.values() if d.get("feeder_id") == feeder_id]
        if cands:
            cands.sort(key=lambda d: str(d.get("created_at", "")), reverse=True)
            return cands[0]
        return None

    def optimize_reliability_event(self, event_id: str, feeder_id: str) -> dict:
        """Run reliability budget optimization for a specific event in-process.

        This replaces the inter-process HTTP call that the old data_api made to
        http://localhost:8003/optimization/reliability-event/optimize.
        """
        from optimization_service.reliability_budget import (
            optimize_with_reliability_budget,
            update_event_with_dispatch_plan,
        )
        event = get_reliability_event(event_id)
        if not event:
            raise KeyError(f"Reliability event {event_id} not found")
        if event.get("status") != "PREDICTED":
            raise ValueError(
                f"Event status must be PREDICTED, got {event.get('status')}"
            )

        predicted_gap = float(event.get("predicted_gap_kw", 0))
        duration = int(event.get("duration_minutes", 30))
        battery_state = get_battery_state(feeder_id)
        battery_soc = float(battery_state.get("soc_kwh", config.battery_capacity_kwh * 0.8))

        result = optimize_with_reliability_budget(
            feeder_id, predicted_gap, duration, battery_soc, config.critical_load_kw
        )

        # Update event in-process (no HTTP needed)
        update_event_with_dispatch_plan(event_id, result)
        # Reload and mirror to unified store
        updated_event = get_reliability_event(event_id)
        if updated_event:
            write_reliability_event(updated_event)

        return {"event_id": event_id, "optimization_result": result, "status": "success"}


# Module-level singleton
optimization_service = OptimizationService()
