from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def calculate_baseline(climate_zone: str, current_consumption: float) -> float:
    """Calculate baseline energy consumption based on climate zone.
    
    Simple baseline calculation for demo purposes.
    """
    # Baseline multipliers by climate zone (conservative estimates)
    multipliers = {
        "tropical_wet": 0.85,
        "warm_humid": 0.88,
        "composite": 0.90,
        "temperate": 0.92,
        "cold": 0.95,
    }
    
    multiplier = multipliers.get(climate_zone, 0.90)
    baseline = current_consumption * multiplier if current_consumption > 0 else 100.0
    
    return round(baseline, 2)
