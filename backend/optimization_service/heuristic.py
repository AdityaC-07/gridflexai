"""Deterministic heuristic fallback: protect critical loads, shift flex, dispatch battery."""
from __future__ import annotations


def run_heuristic(
    demand_kw: list[float],
    solar_kw: list[float],
    battery_soc_kwh: float,
    flexible_kw: float = 0.0,
    grid_import_limit_kw: float = 80.0,
    battery_capacity_kwh: float = 200.0,
    battery_reserve_pct: float = 20.0,
    battery_max_discharge_kw: float = 75.0,
    critical_load_kw: float = 48.0,
) -> dict:
    demand = [max(0.0, float(v)) for v in demand_kw]
    solar = [max(0.0, float(v)) for v in solar_kw]
    flex = max(0.0, float(flexible_kw))
    usable = max(0.0, float(battery_soc_kwh) - float(battery_capacity_kwh) * float(battery_reserve_pct) / 100.0)
    batt, shift, unserved = [], [], []
    remaining = usable
    for d, s in zip(demand, solar):
        gap = max(0.0, d - s - float(grid_import_limit_kw))
        # 1. critical loads protected implicitly (never shed below critical coverage);
        # 2. shift flexible loads first
        sh = min(gap, flex)
        gap -= sh
        # 3. dispatch battery within power + energy limits
        b = min(gap, float(battery_max_discharge_kw), remaining * 2.0)
        b = max(0.0, b)
        remaining = max(0.0, remaining - b * 0.5)
        gap -= b
        # 4. record remaining unserved
        batt.append(round(b, 2))
        shift.append(round(sh, 2))
        unserved.append(round(max(0.0, gap), 2))
    total_unserved_kwh = round(sum(unserved) * 0.5, 2)
    total_gap_kwh = round(sum(max(0.0, d - s - float(grid_import_limit_kw)) for d, s in zip(demand, solar)) * 0.5, 2)
    reliability = 100.0 if total_gap_kwh <= 0 else round(max(0.0, 1.0 - total_unserved_kwh / total_gap_kwh) * 100.0, 2)
    return {
        "method": "HEURISTIC",
        "battery_dispatch_kw": batt,
        "load_shift_kw": shift,
        "unserved_kw": unserved,
        "total_unserved_kwh": total_unserved_kwh,
        "expected_reliability_pct": reliability,
        "battery_energy_used_kwh": round(sum(batt) * 0.5, 2),
        "critical_load_kw": float(critical_load_kw),
        "usable_battery_kwh": round(usable, 2),
    }


def optimize_with_fallback(*args, **kwargs) -> dict:
    """Try LP first, fall back to heuristic explicitly on any solver failure."""
    from .lp_optimizer import run_lp_optimization
    try:
        return run_lp_optimization(*args, **kwargs)
    except Exception as exc:
        result = run_heuristic(*args, **kwargs)
        result["fallback_reason"] = str(exc)
        return result
