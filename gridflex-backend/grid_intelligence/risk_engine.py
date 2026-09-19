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
