"""Central configuration for GridFlex AI Part A. All values overridable via env vars."""
import os
from dataclasses import dataclass, field


def _get_float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


def _get_int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


@dataclass
class Settings:
    aws_region: str = field(default_factory=lambda: os.getenv("AWS_REGION", "ap-south-1"))
    aws_endpoint_url: str | None = field(default_factory=lambda: os.getenv("AWS_ENDPOINT_URL") or None)
    table_prefix: str = field(default_factory=lambda: os.getenv("DYNAMODB_TABLE_PREFIX", "gridflex"))
    feeder_id: str = field(default_factory=lambda: os.getenv("FEEDER_ID", "F01"))
    grid_import_limit_kw: float = field(default_factory=lambda: _get_float("GRID_IMPORT_LIMIT", 80.0))
    battery_capacity_kwh: float = field(default_factory=lambda: _get_float("BATTERY_CAPACITY_KWH", 200.0))
    battery_reserve_pct: float = field(default_factory=lambda: _get_float("BATTERY_RESERVE_PCT", 20.0))
    battery_max_discharge_kw: float = field(default_factory=lambda: _get_float("BATTERY_MAX_DISCHARGE_KW", 75.0))
    battery_max_charge_kw: float = field(default_factory=lambda: _get_float("BATTERY_MAX_CHARGE_KW", 50.0))
    critical_load_kw: float = field(default_factory=lambda: _get_float("CRITICAL_LOAD_KW", 48.0))
    peak_solar_kw: float = field(default_factory=lambda: _get_float("PEAK_SOLAR_KW", 150.0))
    latitude: float = 19.0760
    longitude: float = 72.8777
    forecast_horizon_slots: int = 48
    optimization_horizon_slots: int = 8
    gap_threshold_kw: float = 0.5


settings = Settings()
