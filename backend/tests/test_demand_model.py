import os
import sys

import pandas as pd

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from forecast_service.demand_model import (  # noqa: E402
    DemandForecaster,
    build_features,
    fallback_forecast,
)


def _df():
    csv = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "forecast_service", "training_data.csv")
    return pd.read_csv(csv)


def test_build_features_columns():
    feat = build_features(_df())
    for c in ["rolling_mean_1h", "rolling_mean_6h", "prev_day_same_slot", "prev_week_same_slot"]:
        assert c in feat.columns


def test_train_and_predict_48():
    f = DemandForecaster()
    m = f.train(_df())
    assert m["mae"] >= 0 and m["mae"] < 30
    slots = f.predict_next_48_slots(_df())
    assert len(slots) == 48
    for s in slots:
        assert s["confidence_low_kw"] <= s["forecast_kw"] <= s["confidence_high_kw"]
        assert s["forecast_kw"] >= 0


def test_time_aware_split_sizes():
    f = DemandForecaster()
    m = f.train(_df())
    assert m["n_train"] == 336 - max(48, int(336 * 0.2))
    assert m["n_val"] >= 48


def test_fallback_forecast_shape():
    slots = fallback_forecast(8)
    assert len(slots) == 8
    assert all(s["forecast_kw"] > 0 for s in slots)


def test_save_load_roundtrip(tmp_path):
    f = DemandForecaster(model_path=str(tmp_path / "m.pkl"))
    f.train(_df())
    f.save()
    g = DemandForecaster(model_path=str(tmp_path / "m.pkl"))
    assert g.load() is True
    assert len(g.predict_next_48_slots(_df())) == 48
