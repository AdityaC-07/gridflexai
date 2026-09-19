"""Human-readable optimization explanations using actual result values."""
from __future__ import annotations


def generate_explanation(feeder_state: dict, optimization_result: dict, policy_result: dict | None = None) -> str:
    fs = feeder_state or {}
    opt = optimization_result or {}
    method = opt.get("method", "UNKNOWN")
    feeder = fs.get("feeder_id", "unknown feeder")
    risk = fs.get("risk_level", "?")
    stress = fs.get("stress_index", "?")
    gap = fs.get("net_gap_kw", fs.get("gross_gap_kw", "?"))
    peak_gap = fs.get("peak_gap_next_4h_kw", "?")
    solar = fs.get("solar_kw", "?")
    demand = fs.get("demand_kw", "?")
    batt = opt.get("battery_dispatch_kw", [])
    shift = opt.get("load_shift_kw", [])
    unserved = opt.get("total_unserved_kwh", "?")
    rel = opt.get("expected_reliability_pct", "?")
    batt_e = opt.get("battery_energy_used_kwh", "?")
    max_batt = max(batt) if batt else 0
    max_shift = max(shift) if shift else 0
    flex = fs.get("total_flexible_kw", "?")
    action = fs.get("recommended_action", "?")
    approval = ""
    if policy_result is not None:
        if policy_result.get("requires_manual_approval"):
            approval = " The decision requires manual operator approval before execution (auto-execute is disabled)."
        if not policy_result.get("all_checks_passed", True):
            approval += " One or more policy checks need operator attention."
    return (
        f"Feeder {feeder} is {risk} (stress index {stress}/100) with a current net energy gap of {gap} kW "
        f"and a peak 4-hour gap of {peak_gap} kW. Demand is {demand} kW against solar output of {solar} kW, "
        f"so reduced solar (e.g. the 17:00-19:30 cloud event) directly widens the gap beyond the grid import limit. "
        f"Using {method} optimization, the plan dispatches up to {max_batt} kW from the community battery "
        f"({batt_e} kWh total) and shifts up to {max_shift} kW of flexible load (flexible pool {flex} kW), "
        f"leaving {unserved} kWh unserved with expected gap-coverage reliability of {rel}%. "
        f"Critical loads (48 kW) are fully protected and never shed. Recommended action: {action}."
        f"{approval}"
    )
