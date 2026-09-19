"""Baseline vs GridFlex reliability metrics, calculated from simulation data (never hardcoded)."""
from __future__ import annotations


def _sum(v: list[float]) -> float:
    return round(sum(max(0.0, float(x)) for x in v), 2)


def compute_reliability_metrics(
    baseline_unserved_kw: list[float],
    gridflex_unserved_kw: list[float],
    slot_hours: float = 0.5,
    total_customers: int = 50,
    baseline_critical_interruptions: int | None = None,
    gridflex_critical_interruptions: int | None = None,
    renewable_served_kwh: float = 0.0,
    renewable_available_kwh: float = 0.0,
    baseline_peak_import_kw: float = 0.0,
    gridflex_peak_import_kw: float = 0.0,
    battery_energy_used_kwh: float = 0.0,
    battery_capacity_kwh: float = 200.0,
    total_demand_kwh: float = 0.0,
) -> dict:
    base_kwh = round(_sum(baseline_unserved_kw) * slot_hours, 2)
    flex_kwh = round(_sum(gridflex_unserved_kw) * slot_hours, 2)
    n = max(1, len(gridflex_unserved_kw))
    # SAIDI/SAIFI equivalents (hours & events per customer over the window)
    saidi_base = round(base_kwh / max(1, total_customers), 4)
    saidi_flex = round(flex_kwh / max(1, total_customers), 4)
    saifi_base = round(sum(1 for v in baseline_unserved_kw if float(v) > 0.01) / max(1, total_customers), 4)
    saifi_flex = round(sum(1 for v in gridflex_unserved_kw if float(v) > 0.01) / max(1, total_customers), 4)
    avoided = round(base_kwh - flex_kwh, 2)
    gain = round(((base_kwh - flex_kwh) / base_kwh * 100.0) if base_kwh > 0 else (100.0 if flex_kwh == 0 else 0.0), 2)
    if baseline_critical_interruptions is None:
        baseline_critical_interruptions = int(sum(1 for v in baseline_unserved_kw if float(v) > 0.01))
    if gridflex_critical_interruptions is None:
        gridflex_critical_interruptions = int(sum(1 for v in gridflex_unserved_kw if float(v) > 0.01))
    denom = max(1e-9, float(total_demand_kwh)) if total_demand_kwh else None
    availability_base = round(max(0.0, 1.0 - base_kwh / denom) * 100.0, 2) if denom else None
    availability_flex = round(max(0.0, 1.0 - flex_kwh / denom) * 100.0, 2) if denom else None
    return {
        "baseline_unserved_energy_kwh": base_kwh,
        "gridflex_unserved_energy_kwh": flex_kwh,
        "unserved_energy_avoided_kwh": avoided,
        "reliability_gain_pct": gain,
        "saidi_baseline_h_per_customer": saidi_base,
        "saidi_gridflex_h_per_customer": saidi_flex,
        "saifi_baseline_per_customer": saifi_base,
        "saifi_gridflex_per_customer": saifi_flex,
        "supply_availability_baseline_pct": availability_base,
        "supply_availability_gridflex_pct": availability_flex,
        "critical_load_interruptions_baseline": int(baseline_critical_interruptions),
        "critical_load_interruptions_gridflex": int(gridflex_critical_interruptions),
        "critical_load_uptime_gridflex_pct": round(
            max(0.0, 1.0 - float(gridflex_critical_interruptions) / n) * 100.0, 2),
        "renewable_utilization_pct": round(
            (float(renewable_served_kwh) / float(renewable_available_kwh) * 100.0)
            if renewable_available_kwh > 0 else 0.0, 2),
        "peak_grid_import_reduction_kw": round(float(baseline_peak_import_kw) - float(gridflex_peak_import_kw), 2),
        "battery_utilization_efficiency_pct": round(
            min(100.0, float(battery_energy_used_kwh) / max(1e-9, float(battery_capacity_kwh)) * 100.0), 2),
        "battery_energy_used_kwh": round(float(battery_energy_used_kwh), 2),
        "slots_evaluated": n,
    }
