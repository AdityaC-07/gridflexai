"""Physics-informed solar forecasting for Mumbai (150 kW peak)."""
from __future__ import annotations

import math
from datetime import datetime, timedelta

LATITUDE = 19.0760
LONGITUDE = 72.8777
PEAK_CAPACITY_KW = 150.0


def solar_declination(day_of_year: int) -> float:
    """Solar declination in degrees (Cooper's equation)."""
    return 23.45 * math.sin(math.radians(360.0 / 365.0 * (284 + day_of_year)))


def solar_elevation_angle(latitude: float, day_of_year: int, hour_decimal: float) -> float:
    """Solar elevation angle in degrees."""
    lat_r = math.radians(latitude)
    dec_r = math.radians(solar_declination(day_of_year))
    hour_angle_r = math.radians(15.0 * (hour_decimal - 12.0))
    sin_e = math.sin(lat_r) * math.sin(dec_r) + math.cos(lat_r) * math.cos(dec_r) * math.cos(hour_angle_r)
    sin_e = max(-1.0, min(1.0, sin_e))
    return math.degrees(math.asin(sin_e))


def cloud_event_factor(
    base_cloud: float = 0.85,
    cloud_event_active: bool = False,
    cloud_event_severity: float = 0.0,
    **_: object,
) -> float:
    """Cloud attenuation factor in [0,1]. Severity 0..1 removes up to 90% output."""
    base_cloud = max(0.0, min(1.0, base_cloud))
    if not cloud_event_active:
        return base_cloud
    sev = max(0.0, min(1.0, cloud_event_severity))
    return max(0.0, base_cloud * (1.0 - 0.9 * sev))


def forecast_solar(
    start_time: datetime | None = None,
    n_slots: int = 48,
    peak_kw: float = PEAK_CAPACITY_KW,
    latitude: float = LATITUDE,
    cloud_event_active: bool = False,
    cloud_event_severity: float = 0.0,
    cloud_event_start_slot: int = 0,
    cloud_event_duration_slots: int = 0,
    base_cloud: float = 0.85,
) -> list[dict]:
    """Generate 30-minute solar forecasts. Night output ~0; cloud events reduce output."""
    start_time = start_time or datetime.now().replace(second=0, microsecond=0)
    out: list[dict] = []
    for i in range(n_slots):
        t = start_time + timedelta(minutes=30 * (i + 1))
        doy = t.timetuple().tm_yday
        hour_dec = t.hour + t.minute / 60.0
        elev = solar_elevation_angle(latitude, doy, hour_dec)
        if elev <= 0:
            clear_kw = 0.0
        else:
            clear_kw = peak_kw * math.sin(math.radians(elev))
        in_event = (
            cloud_event_active
            and i >= cloud_event_start_slot
            and i < cloud_event_start_slot + cloud_event_duration_slots
        )
        factor = cloud_event_factor(base_cloud, in_event, cloud_event_severity if in_event else 0.0)
        # outside an explicit event window with global active flag, apply uniform severity
        if cloud_event_active and cloud_event_duration_slots == 0:
            factor = cloud_event_factor(base_cloud, True, cloud_event_severity)
        pred = max(0.0, clear_kw * factor)
        if elev <= 0:
            pred = 0.0
        lo = max(0.0, round(pred * 0.85, 2))
        hi = round(pred * 1.15, 2)
        out.append({
            "offset_minutes": (i + 1) * 30,
            "forecast_kw": round(pred, 2),
            "confidence_low_kw": lo,
            "confidence_high_kw": hi,
        })
    return out
