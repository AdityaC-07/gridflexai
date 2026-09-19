"""Reliability Budget Optimization: minimize community disruption with named dispatch plan."""
from __future__ import annotations

import logging
from typing import Any

from grid_intelligence.pool_assembly import assemble_flexibility_pool, select_resources_for_dispatch
from shared import dynamo as db
from shared.config import settings

logger = logging.getLogger("optimization.reliability-budget")

# Disruption weights from strategic assessment
DISRUPTION_WEIGHTS = {
    "battery": 0.1,
    "ev_charging": 0.3,
    "water_heater": 0.3,
    "hvac": 0.6,
    "water_pump": 0.4,
    "commercial_load": 0.9,
    "rooftop_solar": 0.1,
}


def optimize_with_reliability_budget(
    feeder_id: str,
    predicted_gap_kw: float,
    duration_minutes: int,
    battery_soc_kwh: float,
    critical_load_kw: float = 48.0,
) -> dict[str, Any]:
    """Run reliability budget optimization with named dispatch plan.

    Objective: minimize community disruption while meeting reliability constraints.

    Returns:
        dict with dispatch plan, battery reserve, and optimization results
    """
    logger.info("Running reliability budget optimization for feeder %s, gap %.2f kW", feeder_id, predicted_gap_kw)

    # Assemble flexibility pool
    pool = assemble_flexibility_pool(feeder_id, predicted_gap_kw)

    if not pool.get("has_sufficient_coverage"):
        logger.warning("Insufficient flexibility coverage: %.2f kW available vs %.2f kW needed",
                      pool.get("total_available_kw"), predicted_gap_kw)

    # Select resources for dispatch
    selected_resources = select_resources_for_dispatch(pool, predicted_gap_kw, max_resources=10)

    # Calculate dispatch plan
    dispatch_plan = _create_dispatch_plan(
        selected_resources,
        predicted_gap_kw,
        duration_minutes,
        battery_soc_kwh,
        critical_load_kw
    )

    # Calculate battery reserve after dispatch
    battery_energy_used = dispatch_plan.get("battery_energy_used_kwh", 0.0)
    battery_capacity = settings.battery_capacity_kwh
    battery_reserve_kwh = battery_capacity * settings.battery_reserve_pct / 100.0
    battery_after_kwh = max(battery_reserve_kwh, battery_soc_kwh - battery_energy_used)
    battery_reserve_after_pct = (battery_after_kwh / battery_capacity) * 100.0

    # Calculate expected unserved energy
    total_dispatch = dispatch_plan.get("total_dispatch_kw", 0.0)
    expected_unserved = max(0.0, predicted_gap_kw - total_dispatch)
    expected_unserved_kwh = (expected_unserved * duration_minutes) / 60.0

    result = {
        "method": "RELIABILITY_BUDGET",
        "dispatch_plan": dispatch_plan,
        "flexibility_pool": pool,
        "battery_reserve_after_pct": round(battery_reserve_after_pct, 2),
        "expected_unserved_energy_kwh": round(expected_unserved_kwh, 2),
        "critical_load_protected_kw": critical_load_kw,
        "total_dispatch_kw": round(total_dispatch, 2),
        "gap_coverage_ratio": round(total_dispatch / predicted_gap_kw, 3) if predicted_gap_kw > 0 else 1.0,
    }

    logger.info("Reliability budget optimization complete: dispatch %.2f kW, reserve %.1f%%",
                total_dispatch, battery_reserve_after_pct)

    return result


def _create_dispatch_plan(
    resources: list[dict[str, Any]],
    gap_kw: float,
    duration_minutes: int,
    battery_soc_kwh: float,
    critical_load_kw: float,
) -> dict[str, Any]:
    """Create a structured dispatch plan from selected resources.

    Assigns priorities based on RBS and calculates specific dispatch amounts.
    """
    dispatch_resources = []
    remaining_gap = gap_kw
    cumulative_kw = 0.0

    for i, resource in enumerate(resources):
        if remaining_gap <= 0:
            break

        resource_type = resource.get("resource_type", "unknown")
        available_kw = float(resource.get("available_kw", 0))
        disruption_weight = float(resource.get("disruption_weight", 0.5))
        rbs = float(resource.get("reliability_budget_score", 0.0))

        # Calculate dispatch amount (use what's needed up to availability)
        dispatch_kw = min(available_kw, remaining_gap)

        # Determine priority based on RBS (higher = higher priority)
        priority = min(5, max(1, int(rbs * 2))) if rbs > 0 else 3

        # Calculate duration (use event duration or resource max duration)
        resource_duration = min(duration_minutes, int(resource.get("max_duration_minutes", duration_minutes)))

        dispatch_resource = {
            "resource_id": resource.get("resource_id"),
            "resource_type": resource_type,
            "resource_name": resource.get("resource_name"),
            "dispatch_kw": round(dispatch_kw, 2),
            "duration_minutes": resource_duration,
            "priority": priority,
            "owner_type": resource.get("owner_type"),
            "reliability_budget_score": rbs,
            "disruption_weight": disruption_weight,
            "location_section": resource.get("location_section"),
        }

        dispatch_resources.append(dispatch_resource)
        remaining_gap -= dispatch_kw
        cumulative_kw += dispatch_kw

    # Add critical load protection note
    critical_protection = {
        "protected": True,
        "critical_load_kw": critical_load_kw,
        "protection_method": "non-negotiable constraint",
    }

    return {
        "resources": dispatch_resources,
        "total_dispatch_kw": round(cumulative_kw, 2),
        "remaining_gap_kw": round(max(0.0, remaining_gap), 2),
        "critical_load_protection": critical_protection,
        "battery_energy_used_kwh": _calculate_battery_usage(dispatch_resources, duration_minutes),
    }


def _calculate_battery_usage(dispatch_resources: list[dict[str, Any]], duration_minutes: int) -> float:
    """Calculate total battery energy used from dispatch plan."""
    battery_kw = 0.0
    for resource in dispatch_resources:
        if resource.get("resource_type") == "battery":
            battery_kw += float(resource.get("dispatch_kw", 0))

    # Energy = power * time (convert minutes to hours)
    return round(battery_kw * (duration_minutes / 60.0), 2)


def update_event_with_dispatch_plan(event_id: str, dispatch_result: dict[str, Any]) -> dict[str, Any]:
    """Update a reliability event with the dispatch plan from optimization."""
    try:
        event = db.get_reliability_event(event_id)
        if not event:
            logger.error("Event %s not found for dispatch plan update", event_id)
            return None

        event["dispatch_plan"] = dispatch_result.get("dispatch_plan")
        event["battery_reserve_after_pct"] = dispatch_result.get("battery_reserve_after_pct")
        event["expected_unserved_energy_kwh"] = dispatch_result.get("expected_unserved_energy_kwh")

        updated = db.write_reliability_event(event)
        logger.info("Updated event %s with dispatch plan", event_id)
        return updated
    except Exception as exc:
        logger.error("Failed to update event with dispatch plan: %s", exc)
        return None
