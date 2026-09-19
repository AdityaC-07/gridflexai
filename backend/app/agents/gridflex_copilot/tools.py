"""GridFlex Copilot — read-only tool interface.

CONSTRAINT: Every method in CopilotToolkit is READ-ONLY.
No method may write to the store, approve a decision, or modify grid state.

These tools are designed to be called by:
  • The current rule-based agent (agent.py)
  • A future LLM agent (e.g. Claude via Bedrock Agents / Strands)

To wire in an LLM: replace agent.py while keeping this file unchanged.
The LLM sees exactly these tool signatures and nothing else.

Tool inventory
──────────────
get_current_feeder_state(feeder_id) → dict
get_forecast(feeder_id) → dict | None
get_active_reliability_event(feeder_id) → dict | None
get_flexibility_pool(feeder_id) → dict
get_reliability_metrics(feeder_id) → dict
simulate_optimization(feeder_id) → dict   ← read-only scenario (does NOT persist)
explain_dispatch_plan(event_id) → dict
"""
from __future__ import annotations

import logging

from app.config import config
from app.core.store import (
    get_latest_feeder_state,
    get_latest_forecast,
    get_active_reliability_events,
    get_reliability_event,
    get_feeder_flexibility_pool,
    get_latest_decision,
)

logger = logging.getLogger("app.agents.copilot.tools")


class CopilotToolkit:
    """Read-only tool interface for the GridFlex Copilot.

    All methods are pure reads — no writes, no approvals, no dispatch.
    """

    # ── Tool 1 ─────────────────────────────────────────────────────────────
    def get_current_feeder_state(self, feeder_id: str | None = None) -> dict:
        """Return the latest computed feeder state (risk, gap, battery, etc.).

        This is the primary diagnostic tool.  It does NOT re-run the
        intelligence cycle — it reads the most-recently computed state.
        """
        feeder_id = feeder_id or config.feeder_id
        state = get_latest_feeder_state(feeder_id)
        if not state:
            return {"feeder_id": feeder_id, "status": "UNAVAILABLE",
                    "message": "No feeder state computed yet. Run /api/v1/feeder/{feeder_id}/state first."}
        return state

    # ── Tool 2 ─────────────────────────────────────────────────────────────
    def get_forecast(self, feeder_id: str | None = None) -> dict | None:
        """Return the latest 48-slot demand + solar forecast."""
        feeder_id = feeder_id or config.feeder_id
        return get_latest_forecast(feeder_id)

    # ── Tool 3 ─────────────────────────────────────────────────────────────
    def get_active_reliability_event(self, feeder_id: str | None = None) -> dict | None:
        """Return the most recent active reliability event, or None."""
        feeder_id = feeder_id or config.feeder_id
        events = get_active_reliability_events(feeder_id)
        if not events:
            return None
        # Return most recently created active event
        events.sort(key=lambda e: str(e.get("created_at", "")), reverse=True)
        return events[0]

    # ── Tool 4 ─────────────────────────────────────────────────────────────
    def get_flexibility_pool(self, feeder_id: str | None = None) -> dict:
        """Return the ranked flexibility pool (Reliability Budget Score order)."""
        from app.services.flexibility import flexibility_service
        feeder_id = feeder_id or config.feeder_id
        return flexibility_service.get_pool(feeder_id)

    # ── Tool 5 ─────────────────────────────────────────────────────────────
    def get_reliability_metrics(self, feeder_id: str | None = None) -> dict:
        """Return baseline-vs-GridFlex reliability metrics for the feeder."""
        from app.services.reliability import reliability_service
        feeder_id = feeder_id or config.feeder_id
        return reliability_service.calculate_metrics(feeder_id)

    # ── Tool 6 ─────────────────────────────────────────────────────────────
    def simulate_optimization(self, feeder_id: str | None = None) -> dict:
        """Run an optimization scenario IN MEMORY — does NOT persist the result.

        This is a 'what if' tool.  The resulting dispatch plan is returned for
        explanation purposes only.  It is NOT approved, NOT stored, and does NOT
        affect the live grid.

        The policy layer still applies: the result will show
        ``requires_manual_approval: True`` because auto-execute is always off.
        """
        feeder_id = feeder_id or config.feeder_id
        from app.core.store import get_latest_feeder_state, get_latest_forecast, get_battery_state
        from optimization_service.heuristic import optimize_with_fallback
        from optimization_service.policy_layer import apply_policy
        from optimization_service.explainer import generate_explanation

        state = get_latest_feeder_state(feeder_id)
        forecast = get_latest_forecast(feeder_id)
        battery = get_battery_state(feeder_id)

        n = config.optimization_horizon_slots
        if forecast and forecast.get("demand"):
            demand = [float(s.get("forecast_kw", 80.0)) for s in forecast["demand"][:n]]
            solar = [float(s.get("forecast_kw", 0.0)) for s in (forecast.get("solar") or [])[:n]]
            confidence = float(forecast.get("confidence", 0.75))
        elif state:
            demand = [float(state.get("demand_kw", 80.0))] * n
            solar = [float(state.get("solar_kw", 0.0))] * n
            confidence = float(state.get("forecast_confidence", 0.75))
        else:
            return {"error": "No forecast or feeder state available for simulation."}

        soc_kwh = float(battery.get("soc_kwh", config.battery_capacity_kwh * 0.8))
        flex_kw = float((state or {}).get("total_flexible_kw", 20.0))

        opt = optimize_with_fallback(
            demand, solar, soc_kwh, flex_kw,
            config.grid_import_limit_kw, config.battery_capacity_kwh,
            config.battery_reserve_pct, config.battery_max_discharge_kw,
            config.critical_load_kw,
        )
        soc_after_pct = max(0.0, soc_kwh - opt["battery_energy_used_kwh"]) / config.battery_capacity_kwh * 100.0
        policy = apply_policy(opt, confidence, round(soc_after_pct, 2))
        explanation = generate_explanation(state or {}, opt, policy)

        return {
            "simulation_only": True,
            "persisted": False,
            "optimization": opt,
            "policy": policy,
            "explanation": explanation,
            "note": "This is a read-only scenario. No decision was stored or approved.",
        }

    # ── Tool 7 ─────────────────────────────────────────────────────────────
    def explain_dispatch_plan(self, event_id: str) -> dict:
        """Return a human-readable explanation of an event's dispatch plan."""
        event = get_reliability_event(event_id)
        if not event:
            return {"error": f"Event {event_id} not found."}
        plan = event.get("dispatch_plan")
        if not plan:
            return {
                "event_id": event_id,
                "status": event.get("status"),
                "explanation": "No dispatch plan yet. Optimization has not been run for this event.",
            }
        resources = (plan.get("resources") or [])
        resource_summary = [
            f"  • {r.get('resource_name')} ({r.get('resource_type')}): "
            f"{r.get('dispatch_kw')} kW for {r.get('duration_minutes')} min "
            f"[priority {r.get('priority')}, RBS {r.get('reliability_budget_score', '?')}]"
            for r in resources
        ]
        return {
            "event_id": event_id,
            "status": event.get("status"),
            "predicted_gap_kw": event.get("predicted_gap_kw"),
            "duration_minutes": event.get("duration_minutes"),
            "total_dispatch_kw": plan.get("total_dispatch_kw"),
            "battery_reserve_after_pct": event.get("battery_reserve_after_pct"),
            "resource_count": len(resources),
            "explanation": (
                f"Event {event_id} has a dispatch plan covering {plan.get('total_dispatch_kw')} kW "
                f"of the {event.get('predicted_gap_kw')} kW gap over {event.get('duration_minutes')} minutes.\n"
                f"Resources dispatched (highest Reliability Budget Score first):\n"
                + "\n".join(resource_summary)
                + f"\nBattery reserve after dispatch: {event.get('battery_reserve_after_pct')}%."
                + "\nOperator approval is required before any physical dispatch occurs."
            ),
            "resources": resources,
        }
