import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from reliability_metrics import compute_reliability_metrics  # noqa: E402


def test_gridflex_beats_baseline():
    base = [10.0] * 8
    flex = [2.0] * 8
    m = compute_reliability_metrics(base, flex, battery_energy_used_kwh=20.0)
    assert m["gridflex_unserved_energy_kwh"] < m["baseline_unserved_energy_kwh"]
    assert m["unserved_energy_avoided_kwh"] > 0
    assert m["reliability_gain_pct"] > 0


def test_zero_gap_full_scores():
    m = compute_reliability_metrics([0.0] * 8, [0.0] * 8)
    assert m["baseline_unserved_energy_kwh"] == 0.0
    assert m["reliability_gain_pct"] == 100.0


def test_metrics_not_hardcoded():
    m1 = compute_reliability_metrics([10.0] * 8, [2.0] * 8)
    m2 = compute_reliability_metrics([20.0] * 8, [2.0] * 8)
    assert m1["baseline_unserved_energy_kwh"] != m2["baseline_unserved_energy_kwh"]
    assert m1["unserved_energy_avoided_kwh"] != m2["unserved_energy_avoided_kwh"]


def test_saidi_saifi_present():
    m = compute_reliability_metrics([10.0, 0.0] * 4, [0.0] * 8)
    assert "saidi_gridflex_h_per_customer" in m
    assert "saifi_gridflex_per_customer" in m
    assert "critical_load_interruptions_gridflex" in m


def test_empty_telemetry_cycle_state():
    from grid_intelligence.main import run_intelligence_cycle
    state = run_intelligence_cycle("FEEDER-DOES-NOT-EXIST-XYZ")
    assert state["status"] == "UNAVAILABLE"
    assert "message" in state
