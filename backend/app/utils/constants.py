from __future__ import annotations

CLIMATE_ZONES = ["tropical_wet", "warm_humid", "composite", "temperate", "cold"]

EQUIPMENT_TYPES = ["HVAC", "Lighting", "Electrical", "Controls", "Other"]

SCENARIO_TYPES = ["cloud_event", "demand_surge", "equipment_failure"]

SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

TARIFF_RATES = {
    "peak": 15.50,
    "off_peak": 8.00,
    "normal": 12.00,
}

GRID_THRESHOLDS = {
    "frequency_min": 49.9,
    "frequency_normal": 50.0,
    "frequency_max": 50.1,
    "load_stress": 90.0,
}
