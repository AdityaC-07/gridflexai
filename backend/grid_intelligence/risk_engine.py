"""Deterministic 0-100 stress index + LOW/MEDIUM/HIGH/CRITICAL classification."""
from __future__ import annotations


def compute_stress_index(
    energy_gap_kw: float = 0.0,
    peak_demand_kw: float = 100.0,
    battery_soc_pct: float = 80.0,
    demand_rate_of_change_kw_per_h: float = 0.0,
    forecast_confidence: float = 0.9,
) -> float:
    gap = max(0.0, float(energy_gap_kw))
    peak = max(1.0, float(peak_demand_kw))
    soc = max(0.0, min(100.0, float(battery_soc_pct)))
    roc = abs(float(demand_rate_of_change_kw_per_h))
    conf = max(0.0, min(1.0, float(forecast_confidence)))
    gap_score = min(1.0, gap / (0.5 * peak)) * 40.0          # up to 40 pts
    soc_score = (100.0 - soc) / 100.0 * 25.0                 # up to 25 pts
    roc_score = min(1.0, roc / 20.0) * 15.0                  # up to 15 pts
    conf_score = (1.0 - conf) * 20.0                         # up to 20 pts
    return round(min(100.0, max(0.0, gap_score + soc_score + roc_score + conf_score)), 2)


def classify_risk(stress_index: float) -> str:
    s = float(stress_index)
    if s < 25:
        return "LOW"
    if s < 50:
        return "MEDIUM"
    if s < 75:
        return "HIGH"
    return "CRITICAL"


def recommended_action(risk_level: str) -> str:
    return {
        "LOW": "MONITOR",
        "MEDIUM": "PREPARE_BATTERY",
        "HIGH": "DISPATCH_BATTERY_AND_DR",
        "CRITICAL": "EMERGENCY_DR",
    }.get(risk_level, "MONITOR")


def calculate_voltage_risk(solar_kw: float, demand_kw: float, feeder_capacity_kw: float = 100.0) -> str:
    """Calculate simplified voltage risk proxy based on solar penetration.

    High solar penetration (>60%) with low demand (<40% of peak) indicates voltage rise risk.
    This is a simplified proxy, not a full power flow calculation.
    """
    solar_penetration = solar_kw / feeder_capacity_kw if feeder_capacity_kw > 0 else 0
    demand_ratio = demand_kw / feeder_capacity_kw if feeder_capacity_kw > 0 else 0

    if solar_penetration > 0.6 and demand_ratio < 0.4:
        return "HIGH"
    if solar_penetration > 0.4 and demand_ratio < 0.5:
        return "MEDIUM"
    return "NORMAL"


def calculate_transformer_loading(total_demand_kw: float, transformer_capacity_kva: float = 500.0) -> dict:
    """Calculate transformer loading percentage and status.

    Simplified calculation assuming power factor ~0.9.
    """
    power_factor = 0.9
    load_kw = total_demand_kw
    load_kva = load_kw / power_factor
    loading_pct = (load_kva / transformer_capacity_kva) * 100 if transformer_capacity_kva > 0 else 0

    status = "NORMAL"
    if loading_pct > 90:
        status = "CRITICAL"
    elif loading_pct > 75:
        status = "HIGH"
    elif loading_pct > 60:
        status = "MEDIUM"

    return {
        "loading_pct": round(loading_pct, 1),
        "load_kva": round(load_kva, 1),
        "capacity_kva": transformer_capacity_kva,
        "status": status,
    }
