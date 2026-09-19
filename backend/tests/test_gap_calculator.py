import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from grid_intelligence.flexibility import calculate_flexibility  # noqa: E402
from grid_intelligence.gap_calculator import calculate_gap  # noqa: E402
from grid_intelligence.risk_engine import (  # noqa: E402
    classify_risk,
    compute_stress_index,
)


def test_no_gap_when_supply_sufficient():
    g = calculate_gap(50, 30, 80, 160.0)
    assert g["gross_gap_kw"] == 0.0 and g["net_gap_kw"] == 0.0 and not g["has_gap"]


def test_gap_and_battery_coverage():
    g = calculate_gap(150, 10, 80, 160.0)
    assert g["gross_gap_kw"] == 60.0
    assert g["battery_coverage_kw"] > 0
    assert g["net_gap_kw"] < g["gross_gap_kw"]


def test_zero_battery_no_coverage():
    g = calculate_gap(150, 10, 80, 0.0)
    assert g["battery_coverage_kw"] == 0.0
    assert g["net_gap_kw"] == 60.0


def test_low_battery_reserve_floor():
    g = calculate_gap(150, 10, 80, 40.0)  # exactly at 20% of 200
    assert g["battery_coverage_kw"] == 0.0


def test_noise_threshold():
    g = calculate_gap(80.3, 0, 80, 160.0)
    assert g["gross_gap_kw"] == 0.3 and not g["has_gap"]


def test_stress_thresholds():
    assert classify_risk(10) == "LOW"
    assert classify_risk(30) == "MEDIUM"
    assert classify_risk(60) == "HIGH"
    assert classify_risk(90) == "CRITICAL"


def test_stress_deterministic_bounds():
    for _ in range(3):
        s = compute_stress_index(10, 150, 50.0, 5.0, 0.8)
        assert 0 <= s <= 100


def test_flexibility_consent():
    full = calculate_flexibility()
    assert full["total_flexible_kw"] > 0
    none = calculate_flexibility(consent={"water_heater": False, "non_essential_ac": False, "ev_charging": False})
    assert none["total_flexible_kw"] == 0.0 and none["load_breakdown"] == []
    partial = calculate_flexibility(consent={"water_heater": True, "non_essential_ac": False, "ev_charging": False})
    assert len(partial["load_breakdown"]) == 1
