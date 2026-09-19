import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from optimization_service.policy_layer import apply_policy  # noqa: E402


def _opt(unserved=10.0):
    return {"total_unserved_kwh": unserved, "method": "LP"}


def test_always_manual_approval():
    p = apply_policy(_opt(), 0.9, 60.0)
    assert p["requires_manual_approval"] is True
    assert p["auto_execute"] is False
    assert p["approved"] is False


def test_r1_blocks_critical_shed():
    p = apply_policy(_opt(), 0.9, 60.0, critical_load_shed_kw=5.0)
    r1 = [c for c in p["policy_checks"] if c["rule"] == "R1_CRITICAL_LOAD_PROTECTION"][0]
    assert r1["passed"] is False
    assert p["hard_checks_passed"] is False


def test_r2_battery_reserve():
    p = apply_policy(_opt(), 0.9, 10.0)
    r2 = [c for c in p["policy_checks"] if c["rule"] == "R2_BATTERY_RESERVE"][0]
    assert r2["passed"] is False


def test_r3_low_confidence():
    p = apply_policy(_opt(), 0.4, 60.0)
    r3 = [c for c in p["policy_checks"] if c["rule"] == "R3_FORECAST_CONFIDENCE"][0]
    assert r3["passed"] is False
    assert p["requires_manual_approval"] is True


def test_r4_high_unserved():
    p = apply_policy(_opt(80.0), 0.9, 60.0)
    r4 = [c for c in p["policy_checks"] if c["rule"] == "R4_HIGH_UNSERVED_ENERGY"][0]
    assert r4["passed"] is False


def test_all_pass():
    p = apply_policy(_opt(5.0), 0.9, 60.0)
    assert p["all_checks_passed"] is True
