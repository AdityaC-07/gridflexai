import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from forecast_service.solar_model import (  # noqa: E402
    cloud_event_factor,
    forecast_solar,
    solar_elevation_angle,
)


def test_night_solar_zero():
    slots = forecast_solar(start_time=datetime(2026, 1, 15, 0, 0), n_slots=4)
    assert all(s["forecast_kw"] == 0.0 for s in slots)


def test_midday_positive():
    slots = forecast_solar(start_time=datetime(2026, 6, 15, 11, 30), n_slots=2)
    assert slots[0]["forecast_kw"] > 0


def test_cloud_event_reduces_output():
    base = forecast_solar(start_time=datetime(2026, 6, 15, 11, 30), n_slots=4)
    cloudy = forecast_solar(start_time=datetime(2026, 6, 15, 11, 30), n_slots=4,
                            cloud_event_active=True, cloud_event_severity=0.8,
                            cloud_event_start_slot=0, cloud_event_duration_slots=4)
    for b, c in zip(base, cloudy):
        if b["forecast_kw"] > 0:
            assert c["forecast_kw"] < b["forecast_kw"]


def test_cloud_factor_bounds():
    assert cloud_event_factor(0.85, False, 0.0) == 0.85
    f = cloud_event_factor(0.85, True, 1.0)
    assert 0 <= f < 0.85


def test_elevation_night_negative():
    assert solar_elevation_angle(19.0760, 15, 0.0) < 0


def test_slot_schema():
    slots = forecast_solar(n_slots=48)
    assert len(slots) == 48
    for i, s in enumerate(slots):
        assert s["offset_minutes"] == (i + 1) * 30
