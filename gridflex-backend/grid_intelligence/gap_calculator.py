"""Energy gap calculation."""
from __future__ import annotations


def calculate_gap(
    demand_kw: float,
    solar_kw: float,
    grid_import_limit_kw: float = 80.0,
    battery_soc_kwh: float = 0.0,
    battery_capacity_kwh: float = 200.0,
    battery_max_discharge_kw: float = 75.0,
    battery_reserve_pct: float = 20.0,
    threshold_kw: float = 0.5,
) -> dict:
    demand_kw = max(0.0, float(demand_kw))
    solar_kw = max(0.0, float(solar_kw))
    gross_gap = max(0.0, demand_kw - solar_kw - float(grid_import_limit_kw))
    reserve_kwh = float(battery_capacity_kwh) * float(battery_reserve_pct) / 100.0
    usable_kwh = max(0.0, float(battery_soc_kwh) - reserve_kwh)
    # usable energy over a 30-min slot -> power equivalent
    usable_power_kw = usable_kwh * 2.0
    battery_coverage = min(gross_gap, float(battery_max_discharge_kw), usable_power_kw)
    battery_coverage = max(0.0, battery_coverage)
    net_gap = max(0.0, gross_gap - battery_coverage)
    return {
        "gross_gap_kw": round(gross_gap, 2),
        "battery_coverage_kw": round(battery_coverage, 2),
        "net_gap_kw": round(net_gap, 2),
        "has_gap": bool(net_gap > threshold_kw),
        "usable_battery_kwh": round(usable_kwh, 2),
        "demand_kw": round(demand_kw, 2),
        "solar_kw": round(solar_kw, 2),
    }
