"""LP optimizer over 8 x 30-min slots using scipy.optimize.linprog.

Variables per slot: battery discharge, flexible load shift, unserved energy.
Objective: minimize unserved energy (heavily weighted). Critical load (48 kW)
is protected: it is never a sheddable variable; unserved energy can only cover
non-critical gap above grid import limit.
"""
from __future__ import annotations

import numpy as np
import scipy.optimize as _so


def run_lp_optimization(
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
    n = len(demand_kw)
    if n == 0:
        raise ValueError("demand_kw must be non-empty")
    if len(solar_kw) != n:
        raise ValueError("demand_kw and solar_kw must have equal length")
    demand = [max(0.0, float(v)) for v in demand_kw]
    solar = [max(0.0, float(v)) for v in solar_kw]
    flex = max(0.0, float(flexible_kw))
    usable_kwh = max(0.0, float(battery_soc_kwh) - float(battery_capacity_kwh) * float(battery_reserve_pct) / 100.0)
    gaps = [max(0.0, d - s - float(grid_import_limit_kw)) for d, s in zip(demand, solar)]

    nvars = 3 * n
    c = np.zeros(nvars)
    for i in range(n):
        c[i] = 1.0          # battery discharge (small cost)
        c[n + i] = 0.5      # load shift (cheapest)
        c[2 * n + i] = 1000.0  # unserved (heavily penalized)

    # -batt - shift - unserved <= -gap  (i.e. coverage must meet gap)
    A_ub = np.zeros((n + 1, nvars))
    b_ub = np.zeros(n + 1)
    for i in range(n):
        A_ub[i, i] = -1.0
        A_ub[i, n + i] = -1.0
        A_ub[i, 2 * n + i] = -1.0
        b_ub[i] = -gaps[i]
    # battery energy limit: sum(batt * 0.5h) <= usable
    for i in range(n):
        A_ub[n, i] = 0.5
    b_ub[n] = usable_kwh

    bounds = []
    for i in range(n):
        bounds.append((0.0, float(battery_max_discharge_kw)))
    for i in range(n):
        bounds.append((0.0, flex))
    for i in range(n):
        bounds.append((0.0, None))

    res = _so.linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=bounds, method="highs")
    if not res.success:
        raise RuntimeError(f"linprog failed: {res.message}")
    x = res.x
    batt = [round(max(0.0, float(x[i])), 2) for i in range(n)]
    shift = [round(max(0.0, float(x[n + i])), 2) for i in range(n)]
    unserved = [round(max(0.0, float(x[2 * n + i])), 2) for i in range(n)]
    total_unserved_kwh = round(sum(unserved) * 0.5, 2)
    total_gap_kwh = round(sum(gaps) * 0.5, 2)
    if total_gap_kwh <= 0:
        reliability = 100.0
    else:
        reliability = round(max(0.0, (1.0 - total_unserved_kwh / total_gap_kwh)) * 100.0, 2)
    return {
        "method": "LP",
        "battery_dispatch_kw": batt,
        "load_shift_kw": shift,
        "unserved_kw": unserved,
        "total_unserved_kwh": total_unserved_kwh,
        "expected_reliability_pct": reliability,
        "battery_energy_used_kwh": round(sum(batt) * 0.5, 2),
        "critical_load_kw": float(critical_load_kw),
        "usable_battery_kwh": round(usable_kwh, 2),
    }
