"""Safety / Policy Layer: R1 critical load, R2 battery reserve, R3 confidence, R4 unserved.

MVP: always requires manual operator approval; never auto-executes.
"""
from __future__ import annotations


def apply_policy(
    optimization_result: dict,
    forecast_confidence: float = 0.9,
    battery_soc_after_pct: float = 50.0,
    critical_load_shed_kw: float = 0.0,
    unserved_energy_warn_kwh: float = 50.0,
    min_confidence: float = 0.6,
    battery_reserve_pct: float = 20.0,
) -> dict:
    checks: list[dict] = []
    # R1 — critical load protection
    r1 = float(critical_load_shed_kw) <= 1e-9
    checks.append({
        "rule": "R1_CRITICAL_LOAD_PROTECTION",
        "passed": bool(r1),
        "message": "Critical loads protected; no critical shedding."
        if r1 else f"BLOCKED: optimization sheds critical load ({critical_load_shed_kw} kW).",
    })
    # R2 — battery reserve floor
    r2 = float(battery_soc_after_pct) >= float(battery_reserve_pct) - 1e-9
    checks.append({
        "rule": "R2_BATTERY_RESERVE",
        "passed": bool(r2),
        "message": f"Battery SOC after dispatch {battery_soc_after_pct}% >= reserve {battery_reserve_pct}%."
        if r2 else f"BLOCKED: dispatch would breach reserve (SOC {battery_soc_after_pct}% < {battery_reserve_pct}%).",
    })
    # R3 — forecast confidence
    conf = float(forecast_confidence)
    r3 = conf >= float(min_confidence)
    checks.append({
        "rule": "R3_FORECAST_CONFIDENCE",
        "passed": bool(r3),
        "message": f"Forecast confidence {conf:.2f} >= {min_confidence:.2f}."
        if r3 else f"Manual approval required: confidence {conf:.2f} < {min_confidence:.2f}.",
    })
    # R4 — high unserved energy escalation
    unserved = float((optimization_result or {}).get("total_unserved_kwh", 0.0))
    r4 = unserved <= float(unserved_energy_warn_kwh)
    checks.append({
        "rule": "R4_HIGH_UNSERVED_ENERGY",
        "passed": bool(r4),
        "message": f"Unserved energy {unserved} kWh within limit."
        if r4 else f"OPERATOR ESCALATION: unserved energy {unserved} kWh > {unserved_energy_warn_kwh} kWh.",
    })
    hard_pass = bool(r1 and r2)
    return {
        "approved": False,  # MVP: manual approval always required
        "requires_manual_approval": True,
        "auto_execute": False,
        "policy_checks": checks,
        "all_checks_passed": bool(hard_pass and r3 and r4),
        "hard_checks_passed": bool(hard_pass),
        "optimization_result": optimization_result or {},
    }
