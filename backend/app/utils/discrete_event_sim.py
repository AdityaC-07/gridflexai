from __future__ import annotations

import math
from typing import Tuple


def calculate_solar_generation(hour: int, day_length: int = 12) -> float:
    """Calculate solar generation factor."""
    if hour < 6 or hour > 18:
        return 0.0
    peak_hour = 12
    factor = math.sin(math.pi * (hour - 6) / 12)
    return factor * 150.0  # peak 150 kW


def calculate_baseline_demand(hour: int, occupancy_percent: float = 1.0) -> float:
    """Calculate baseline demand."""
    # Typical daily pattern
    if 0 <= hour < 6:
        base = 60
    elif 6 <= hour < 9:
        base = 80
    elif 9 <= hour < 17:
        base = 120
    elif 17 <= hour < 21:
        base = 140
    else:
        base = 90
    return base * occupancy_percent


def simulate_grid_frequency(import_kw: float, generation_kw: float) -> float:
    """Simulate grid frequency."""
    inertia_constant = 1000.0
    imbalance = generation_kw - import_kw
    freq_delta = imbalance / inertia_constant
    return 50.0 + freq_delta


def track_battery_soc(current_soc: float, discharge_kw: float, duration_hours: float, capacity_kwh: float = 200.0) -> float:
    """Track battery SOC."""
    soc_change = (discharge_kw * duration_hours) / capacity_kwh * 100.0
    new_soc = current_soc - soc_change
    return max(0.0, min(100.0, new_soc))
