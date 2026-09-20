"""GridFlex Copilot — read-only tool implementations.

Every function here corresponds exactly to a tool spec in prompts.py.
Every function is READ-ONLY or SIMULATE-ONLY — no writes, no approvals,
no dispatch.

The permission layer (permissions.py) is enforced by the agent BEFORE
calling any function here. These functions trust they have already been
permission-checked.

Tool inventory (10 tools)
──────────────────────────
  get_current_grid_state(feeder_id)
  get_forecast(feeder_id)
  get_active_reliability_events(feeder_id)
  get_reliability_event(event_id)
  get_flexibility_pool(feeder_id)
  get_spatial_state(feeder_id)
  get_reliability_metrics(feeder_id)
  simulate_optimization(feeder_id, scenario)
  explain_dispatch_plan(event_id)
  compare_forecast_actual(event_id)
"""
from __future__ import annotations

import logging
from typing import Any

from app.config import config
from app.core.store import (
    get_latest_feeder_state,
    get_latest_forecast,
    get_active_reliability_events as _store_get_active_events,
    get_reliability_event as _store_get_event,
    get_feeder_flexibility_pool,
    get_latest_decision,
)

logger = logging.getLogger("app.agents.copilot.tools")


# ─────────────────────────────────────────────────────────────────────────────
# Tool 1 — get_current_grid_state
# ─────────────────────────────────────────────────────────────────────────────

def get_current_grid_state(feeder_id: str | None = None) -> dict[str, Any]:
    """Return the latest computed feeder state.

    Calls the existing GridIntelligenceService.  Does NOT trigger a new
    intelligence cycle — returns the most-recently cached state.
    If the state is stale or missing, triggers one live cycle.
    """
    feeder_id = feeder_id or config.feeder_id
    state = get_latest_feeder_state(feeder_id)

    if not state or state.get("status") != "OK":
        # Attempt a live cycle to populate the store
        try:
            from app.services.grid_intelligence import grid_service
            state = grid_service.evaluate_feeder_state(feeder_id)
        except Exception as exc:
            logger.warning("Live grid cycle failed in tool: %s", exc)

    if not state:
        return {
            "feeder_id": feeder_id,
            "status": "UNAVAILABLE",
            "message": "No feeder state available. Ensure forecast has been refreshed.",
        }

    # Return a clean, LLM-friendly subset
    return {
        "feeder_id": feeder_id,
        "status": state.get("status"),
        "risk_level": state.get("risk_level"),
        "stress_index": state.get("stress_index"),
        "demand_kw": state.get("demand_kw"),
        "solar_kw": state.get("solar_kw"),
        "net_gap_kw": state.get("net_gap_kw"),
        "gross_gap_kw": state.get("gross_gap_kw"),
        "peak_gap_next_4h_kw": state.get("peak_gap_next_4h_kw"),
        "has_gap": state.get("has_gap"),
        "battery_soc_pct": state.get("battery_soc_pct"),
        "battery_soc_kwh": state.get("battery_soc_kwh"),
        "battery_coverage_kw": state.get("battery_coverage_kw"),
        "grid_import_limit_kw": state.get("grid_import_limit_kw"),
        "total_flexible_kw": state.get("total_flexible_kw"),
        "recommended_action": state.get("recommended_action"),
        "forecast_confidence": state.get("forecast_confidence"),
        "voltage_risk": state.get("voltage_risk"),
        "transformer_loading": state.get("transformer_loading"),
        "timestamp": state.get("timestamp"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Tool 2 — get_forecast
# ─────────────────────────────────────────────────────────────────────────────

def get_forecast(feeder_id: str | None = None) -> dict[str, Any]:
    """Return the latest 48-slot (24-hour) demand + solar forecast."""
    feeder_id = feeder_id or config.feeder_id
    doc = get_latest_forecast(feeder_id)
    if not doc:
        return {
            "feeder_id": feeder_id,
            "available": False,
            "message": "No forecast available. POST /api/v1/forecast/{feeder_id}/refresh first.",
        }

    # Summarise the first 8 slots (4 hours) for the LLM + full list
    demand_slots = doc.get("demand", [])
    solar_slots  = doc.get("solar",  [])

    next_4h_demand = [s.get("forecast_kw", 0) for s in demand_slots[:8]]
    next_4h_solar  = [s.get("forecast_kw", 0) for s in solar_slots[:8]]
    next_4h_gaps   = [
        round(max(0.0, d - s - config.grid_import_limit_kw), 2)
        for d, s in zip(next_4h_demand, next_4h_solar)
    ]

    peak_gap_kw    = max(next_4h_gaps) if next_4h_gaps else 0.0
    peak_demand_kw = max(next_4h_demand) if next_4h_demand else 0.0

    return {
        "feeder_id": feeder_id,
        "available": True,
        "model": doc.get("model"),
        "confidence": doc.get("confidence"),
        "timestamp": doc.get("timestamp"),
        "next_4h_peak_demand_kw": round(peak_demand_kw, 2),
        "next_4h_peak_gap_kw": round(peak_gap_kw, 2),
        "next_4h_demand_series_kw": [round(v, 2) for v in next_4h_demand],
        "next_4h_solar_series_kw":  [round(v, 2) for v in next_4h_solar],
        "next_4h_gap_series_kw":    next_4h_gaps,
        "total_slots": len(demand_slots),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Tool 3 — get_active_reliability_events
# ─────────────────────────────────────────────────────────────────────────────

def get_active_reliability_events(feeder_id: str | None = None) -> dict[str, Any]:
    """Return all currently active reliability events for a feeder."""
    feeder_id = feeder_id or config.feeder_id
    events = _store_get_active_events(feeder_id)
    if not events:
        return {
            "feeder_id": feeder_id,
            "active_event_count": 0,
            "events": [],
            "message": "No active reliability events. Feeder is operating normally.",
        }

    summary = []
    for e in events:
        summary.append({
            "event_id": e.get("event_id"),
            "status": e.get("status"),
            "risk_level": e.get("risk_level"),
            "predicted_gap_kw": e.get("predicted_gap_kw"),
            "duration_minutes": e.get("duration_minutes"),
            "flexibility_available_kw": e.get("flexibility_available_kw"),
            "critical_load_kw": e.get("critical_load_kw"),
            "forecast_confidence": e.get("forecast_confidence"),
            "created_at": e.get("created_at"),
            "time_to_event_minutes": e.get("time_to_event_minutes"),
            "has_dispatch_plan": e.get("dispatch_plan") is not None,
        })

    return {
        "feeder_id": feeder_id,
        "active_event_count": len(summary),
        "events": summary,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Tool 4 — get_reliability_event
# ─────────────────────────────────────────────────────────────────────────────

def get_reliability_event(event_id: str) -> dict[str, Any]:
    """Return full detail for a specific reliability event."""
    event = _store_get_event(event_id)
    if not event:
        return {
            "found": False,
            "event_id": event_id,
            "message": f"Event {event_id} not found in the store.",
        }

    plan = event.get("dispatch_plan")
    plan_summary = None
    if plan:
        resources = plan.get("resources", [])
        plan_summary = {
            "total_dispatch_kw": plan.get("total_dispatch_kw"),
            "battery_energy_used_kwh": plan.get("battery_energy_used_kwh"),
            "resource_count": len(resources),
            "resources": [
                {
                    "name": r.get("resource_name"),
                    "type": r.get("resource_type"),
                    "dispatch_kw": r.get("dispatch_kw"),
                    "duration_minutes": r.get("duration_minutes"),
                    "priority": r.get("priority"),
                    "rbs": r.get("reliability_budget_score"),
                }
                for r in resources
            ],
        }

    return {
        "found": True,
        "event_id": event.get("event_id"),
        "feeder_id": event.get("feeder_id"),
        "status": event.get("status"),
        "risk_level": event.get("risk_level"),
        "predicted_gap_kw": event.get("predicted_gap_kw"),
        "duration_minutes": event.get("duration_minutes"),
        "critical_load_kw": event.get("critical_load_kw"),
        "flexibility_available_kw": event.get("flexibility_available_kw"),
        "forecast_confidence": event.get("forecast_confidence"),
        "battery_reserve_after_pct": event.get("battery_reserve_after_pct"),
        "created_at": event.get("created_at"),
        "approved_at": event.get("approved_at"),
        "verified_at": event.get("verified_at"),
        "dispatch_plan": plan_summary,
        "outcome": event.get("outcome"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Tool 5 — get_flexibility_pool
# ─────────────────────────────────────────────────────────────────────────────

def get_flexibility_pool(feeder_id: str | None = None) -> dict[str, Any]:
    """Return the ranked flexibility pool for a feeder."""
    feeder_id = feeder_id or config.feeder_id
    try:
        from app.services.flexibility import flexibility_service
        pool = flexibility_service.get_pool(feeder_id)
    except Exception as exc:
        logger.warning("Flexibility pool error: %s", exc)
        return {"feeder_id": feeder_id, "error": str(exc), "resources": []}

    resources = pool.get("resources", [])
    resource_summary = [
        {
            "resource_id": r.get("resource_id"),
            "name": r.get("resource_name"),
            "type": r.get("resource_type"),
            "available_kw": r.get("available_kw"),
            "max_duration_minutes": r.get("max_duration_minutes"),
            "response_time_minutes": r.get("response_time_minutes"),
            "disruption_weight": r.get("disruption_weight"),
            "reliability_budget_score": r.get("reliability_budget_score"),
            "owner_type": r.get("owner_type"),
        }
        for r in resources
    ]

    return {
        "feeder_id": feeder_id,
        "total_available_kw": pool.get("total_available_kw", 0),
        "total_needed_kw": pool.get("total_needed_kw", 0),
        "coverage_ratio": pool.get("coverage_ratio", 0),
        "has_sufficient_coverage": pool.get("has_sufficient_coverage", False),
        "resource_count": len(resources),
        "resources": resource_summary,
    }


# ─────────────────────────────────────────────────────────────────────────────
# Tool 6 — get_spatial_state
# ─────────────────────────────────────────────────────────────────────────────

def get_spatial_state(feeder_id: str | None = None) -> dict[str, Any]:
    """Return the feeder's spatial / topological state."""
    feeder_id = feeder_id or config.feeder_id
    state = get_latest_feeder_state(feeder_id)
    if not state:
        return {"feeder_id": feeder_id, "available": False}

    return {
        "feeder_id": feeder_id,
        "available": True,
        "transformer_loading": state.get("transformer_loading", {}),
        "voltage_risk": state.get("voltage_risk", "NORMAL"),
        "demand_kw": state.get("demand_kw"),
        "solar_kw": state.get("solar_kw"),
        "grid_import_limit_kw": state.get("grid_import_limit_kw"),
        # Section-level topology (from the digital twin model)
        "feeder_sections": [
            {
                "section": "Section A",
                "load_pct": 65,
                "critical_facilities": ["Hospital Annex", "School"],
                "notes": "Critical loads protected — never shed",
            },
            {
                "section": "Section B",
                "load_pct": 78,
                "critical_facilities": ["Community Battery BESS-F01"],
                "notes": "Battery dispatch asset located here",
            },
            {
                "section": "Section C",
                "load_pct": 45,
                "critical_facilities": ["EV Charging Hub"],
                "notes": "Deferrable EV load — flexible",
            },
        ],
        "location": {
            "latitude": config.latitude,
            "longitude": config.longitude,
            "area": "Dharavi, Central Mumbai",
            "discom": "MSEDCL",
        },
        "timestamp": state.get("timestamp"),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Tool 7 — get_reliability_metrics
# ─────────────────────────────────────────────────────────────────────────────

def get_reliability_metrics(feeder_id: str | None = None) -> dict[str, Any]:
    """Return baseline vs. GridFlex reliability metrics."""
    feeder_id = feeder_id or config.feeder_id
    try:
        from app.services.reliability import reliability_service
        return reliability_service.calculate_metrics(feeder_id)
    except Exception as exc:
        logger.warning("Reliability metrics error: %s", exc)
        return {"feeder_id": feeder_id, "error": str(exc)}


# ─────────────────────────────────────────────────────────────────────────────
# Tool 8 — simulate_optimization
# ─────────────────────────────────────────────────────────────────────────────

def simulate_optimization(
    feeder_id: str | None = None,
    scenario: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Run an in-memory optimization scenario.

    IMPORTANT: Results are NOT persisted.  This is a read-only simulation.
    The scenario dict can override solar, demand, or battery SoC.

    Scenario keys:
        solar_reduction_pct      (float 0-100): reduce current solar by this %
        demand_increase_pct      (float 0-100): increase current demand by this %
        battery_soc_override_pct (float 0-100): override battery SoC
    """
    feeder_id = feeder_id or config.feeder_id
    scenario   = scenario or {}

    from app.core.store import get_latest_forecast, get_battery_state
    from optimization_service.heuristic import optimize_with_fallback
    from optimization_service.policy_layer import apply_policy
    from optimization_service.explainer import generate_explanation

    state    = get_latest_feeder_state(feeder_id)
    forecast = get_latest_forecast(feeder_id)
    battery  = get_battery_state(feeder_id)

    n = config.optimization_horizon_slots

    if forecast and forecast.get("demand"):
        demand = [float(s.get("forecast_kw", 80.0)) for s in forecast["demand"][:n]]
        solar  = [float(s.get("forecast_kw", 0.0))  for s in (forecast.get("solar") or [])[:n]]
        confidence = float(forecast.get("confidence", 0.75))
    elif state:
        demand = [float(state.get("demand_kw", 80.0))] * n
        solar  = [float(state.get("solar_kw", 0.0))]   * n
        confidence = float(state.get("forecast_confidence", 0.75))
    else:
        return {
            "simulation_only": True,
            "error": "No forecast or feeder state available for simulation.",
        }

    # Apply scenario overrides
    solar_reduction  = float(scenario.get("solar_reduction_pct", 0)) / 100.0
    demand_increase  = float(scenario.get("demand_increase_pct", 0)) / 100.0
    soc_override_pct = scenario.get("battery_soc_override_pct")

    if solar_reduction > 0:
        solar = [round(s * (1.0 - solar_reduction), 2) for s in solar]
    if demand_increase > 0:
        demand = [round(d * (1.0 + demand_increase), 2) for d in demand]

    soc_kwh = float(battery.get("soc_kwh", config.battery_capacity_kwh * 0.8))
    if soc_override_pct is not None:
        soc_kwh = float(soc_override_pct) / 100.0 * config.battery_capacity_kwh

    flex_kw = float((state or {}).get("total_flexible_kw", 20.0))

    opt = optimize_with_fallback(
        demand, solar, soc_kwh, flex_kw,
        config.grid_import_limit_kw, config.battery_capacity_kwh,
        config.battery_reserve_pct, config.battery_max_discharge_kw,
        config.critical_load_kw,
    )

    soc_after_pct = max(0.0, soc_kwh - opt["battery_energy_used_kwh"]) / config.battery_capacity_kwh * 100.0
    policy      = apply_policy(opt, confidence, round(soc_after_pct, 2))
    explanation = generate_explanation(state or {}, opt, policy)

    return {
        "simulation_only": True,
        "persisted": False,
        "scenario_applied": scenario,
        "scenario_description": _describe_scenario(scenario, solar_reduction, demand_increase),
        "optimization": {
            "method": opt.get("method"),
            "max_battery_dispatch_kw": max(opt.get("battery_dispatch_kw", [0])),
            "max_load_shift_kw": max(opt.get("load_shift_kw", [0])),
            "total_unserved_kwh": opt.get("total_unserved_kwh"),
            "expected_reliability_pct": opt.get("expected_reliability_pct"),
            "battery_energy_used_kwh": opt.get("battery_energy_used_kwh"),
            "critical_load_kw": opt.get("critical_load_kw", config.critical_load_kw),
        },
        "policy": {
            "hard_checks_passed": policy.get("hard_checks_passed"),
            "requires_manual_approval": policy.get("requires_manual_approval"),
            "all_checks_passed": policy.get("all_checks_passed"),
        },
        "explanation": explanation,
        "warning": "⚠️ SIMULATION — results are not live operational data and have not been approved or executed.",
    }


def _describe_scenario(scenario: dict, solar_reduction: float, demand_increase: float) -> str:
    parts = []
    if solar_reduction > 0:
        parts.append(f"Solar reduced by {solar_reduction*100:.0f}%")
    if demand_increase > 0:
        parts.append(f"Demand increased by {demand_increase*100:.0f}%")
    if "battery_soc_override_pct" in scenario:
        parts.append(f"Battery SoC set to {scenario['battery_soc_override_pct']}%")
    return "; ".join(parts) if parts else "Baseline — no scenario overrides"


# ─────────────────────────────────────────────────────────────────────────────
# Tool 9 — explain_dispatch_plan
# ─────────────────────────────────────────────────────────────────────────────

def explain_dispatch_plan(event_id: str) -> dict[str, Any]:
    """Return a structured explanation of an event's dispatch plan."""
    event = _store_get_event(event_id)
    if not event:
        return {
            "found": False,
            "event_id": event_id,
            "message": f"Event {event_id} not found.",
        }

    plan = event.get("dispatch_plan")
    if not plan:
        return {
            "found": True,
            "event_id": event_id,
            "status": event.get("status"),
            "has_dispatch_plan": False,
            "message": (
                f"Event {event_id} exists (status={event.get('status')}) "
                "but no dispatch plan has been generated yet. "
                "Run POST /api/v1/events/{event_id}/optimize to generate one."
            ),
        }

    resources = plan.get("resources", [])
    resource_explanations = []
    for r in resources:
        resource_explanations.append({
            "name": r.get("resource_name"),
            "type": r.get("resource_type"),
            "dispatch_kw": r.get("dispatch_kw"),
            "duration_minutes": r.get("duration_minutes"),
            "priority": r.get("priority"),
            "rbs": r.get("reliability_budget_score"),
            "disruption_weight": r.get("disruption_weight"),
            "owner_type": r.get("owner_type"),
            "selection_reason": (
                f"Selected because Reliability Budget Score (RBS={r.get('reliability_budget_score','?')}) "
                f"is high relative to community disruption (weight={r.get('disruption_weight','?')})"
            ),
        })

    return {
        "found": True,
        "has_dispatch_plan": True,
        "event_id": event_id,
        "status": event.get("status"),
        "predicted_gap_kw": event.get("predicted_gap_kw"),
        "duration_minutes": event.get("duration_minutes"),
        "total_dispatch_kw": plan.get("total_dispatch_kw"),
        "battery_energy_used_kwh": plan.get("battery_energy_used_kwh"),
        "battery_reserve_after_pct": event.get("battery_reserve_after_pct"),
        "resource_count": len(resources),
        "resource_selection_explanation": (
            "Resources are ranked by Reliability Budget Score (RBS = reliability_value / disruption_weight "
            "× flexibility_confidence × availability). Higher RBS = dispatched first. "
            "Community batteries and EV chargers have lowest disruption weight and are preferred over HVAC."
        ),
        "resources": resource_explanations,
        "critical_load_protection": plan.get("critical_load_protection"),
        "approval_note": "Operator approval is required before any dispatch occurs. Auto-execution is permanently disabled.",
    }


# ─────────────────────────────────────────────────────────────────────────────
# Tool 10 — compare_forecast_actual
# ─────────────────────────────────────────────────────────────────────────────

def compare_forecast_actual(event_id: str) -> dict[str, Any]:
    """Compare planned dispatch vs. actual outcomes for a completed event."""
    event = _store_get_event(event_id)
    if not event:
        return {
            "found": False,
            "event_id": event_id,
            "message": f"Event {event_id} not found.",
        }

    status = event.get("status")
    if status not in ("VERIFIED", "CLOSED"):
        return {
            "found": True,
            "event_id": event_id,
            "status": status,
            "comparable": False,
            "message": (
                f"Event {event_id} has status '{status}'. "
                "Forecast vs. actual comparison is only available for VERIFIED or CLOSED events."
            ),
        }

    outcome = event.get("outcome", {})
    plan    = event.get("dispatch_plan", {})

    planned_kw  = plan.get("total_dispatch_kw", 0)
    actual_kw   = outcome.get("total_actual_dispatch_kw", 0)
    compliance_pct = round(actual_kw / planned_kw * 100, 1) if planned_kw > 0 else None

    return {
        "found": True,
        "event_id": event_id,
        "status": status,
        "comparable": True,
        "comparison": {
            "planned_dispatch_kw": planned_kw,
            "actual_dispatch_kw": actual_kw,
            "compliance_pct": compliance_pct,
            "planned_gap_kw": event.get("predicted_gap_kw"),
            "actual_unserved_energy_kwh": outcome.get("actual_unserved_energy_kwh"),
            "battery_soc_final_pct": outcome.get("battery_soc_final_pct"),
            "saidi_avoided_hours": outcome.get("saidi_avoided_hours"),
            "community_reliability_score": outcome.get("community_score"),
            "verified_at": outcome.get("verified_at"),
        },
        "resource_compliance": outcome.get("actual_dispatch", {}),
        "assessment": (
            f"{'GOOD' if (compliance_pct or 0) >= 90 else 'PARTIAL' if (compliance_pct or 0) >= 70 else 'POOR'} "
            f"compliance ({compliance_pct}%). "
            f"Actual dispatch covered {'most' if (compliance_pct or 0) >= 85 else 'some'} of the planned response."
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# Dispatcher — called by agent.py to route tool_name → function
# ─────────────────────────────────────────────────────────────────────────────

_TOOL_REGISTRY: dict[str, Any] = {
    "get_current_grid_state":       get_current_grid_state,
    "get_forecast":                 get_forecast,
    "get_active_reliability_events": get_active_reliability_events,
    "get_reliability_event":        get_reliability_event,
    "get_flexibility_pool":         get_flexibility_pool,
    "get_spatial_state":            get_spatial_state,
    "get_reliability_metrics":      get_reliability_metrics,
    "simulate_optimization":        simulate_optimization,
    "explain_dispatch_plan":        explain_dispatch_plan,
    "compare_forecast_actual":      compare_forecast_actual,
}


def execute_tool(tool_name: str, tool_input: dict[str, Any]) -> Any:
    """Execute a GridFlex tool by name with the given input dict.

    Permission check is performed by agent.py BEFORE calling this.
    This function dispatches to the correct implementation.

    Args:
        tool_name:  Name matching the Converse toolSpec.
        tool_input: Input dict from the Bedrock toolUse block.

    Returns:
        Tool result (dict or str).

    Raises:
        KeyError: If tool_name is not in the registry (should not happen
                  if permissions.py is checked first).
    """
    if tool_name not in _TOOL_REGISTRY:
        raise KeyError(f"Tool '{tool_name}' not found in registry.")

    fn = _TOOL_REGISTRY[tool_name]
    logger.info("Executing tool: %s  input_keys=%s", tool_name, list(tool_input.keys()))

    try:
        result = fn(**tool_input)
        return result
    except TypeError as exc:
        # Called with wrong kwargs — surface as a tool error
        logger.warning("Tool %s called with bad args %s: %s", tool_name, tool_input, exc)
        return {"error": f"Tool called with unexpected arguments: {exc}"}
    except Exception as exc:
        logger.error("Tool %s failed: %s", tool_name, exc)
        return {"error": f"Tool execution error: {exc}"}
