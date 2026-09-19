import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from optimization_service.heuristic import run_heuristic  # noqa: E402
from optimization_service.lp_optimizer import run_lp_optimization  # noqa: E402


def _case():
    demand = [120.0, 130.0, 140.0, 135.0, 125.0, 110.0, 100.0, 95.0]
    solar = [10.0, 5.0, 2.0, 1.0, 0.0, 0.0, 0.0, 0.0]
    return demand, solar


def test_lp_success_structure():
    d, s = _case()
    r = run_lp_optimization(d, s, 160.0, 20.0)
    assert r["method"] == "LP"
    assert len(r["battery_dispatch_kw"]) == 8
    assert r["total_unserved_kwh"] >= 0
    assert 0 <= r["expected_reliability_pct"] <= 100
    assert max(r["battery_dispatch_kw"]) <= 75.0


def test_lp_no_gap_full_reliability():
    r = run_lp_optimization([50.0] * 8, [30.0] * 8, 160.0, 20.0)
    assert r["total_unserved_kwh"] == 0.0
    assert r["expected_reliability_pct"] == 100.0


def test_lp_large_gap_unserved():
    d = [300.0] * 8
    s = [0.0] * 8
    r = run_lp_optimization(d, s, 40.0, 5.0)  # reserve-bound battery
    assert r["total_unserved_kwh"] > 50.0


def test_heuristic_matches_structure():
    d, s = _case()
    r = run_heuristic(d, s, 160.0, 20.0)
    assert r["method"] == "HEURISTIC"
    assert len(r["unserved_kw"]) == 8


def test_heuristic_zero_battery():
    d, s = _case()
    r = run_heuristic(d, s, 0.0, 20.0)
    assert all(b == 0.0 for b in r["battery_dispatch_kw"])


def test_fallback_on_solver_failure(monkeypatch):
    import optimization_service.heuristic as h
    import scipy.optimize as so

    def boom(*a, **k):
        raise RuntimeError("solver down")

    monkeypatch.setattr(so, "linprog", boom)
    d, s = _case()
    r = h.optimize_with_fallback(d, s, 160.0, 20.0)
    assert r["method"] == "HEURISTIC"
    assert "fallback_reason" in r
