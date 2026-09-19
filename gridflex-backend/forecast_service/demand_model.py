"""Ridge Regression demand forecaster (30-min slots, 48-slot horizon)."""
from __future__ import annotations

import math
import os
import pickle
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler

FEATURE_COLS = [
    "hour_of_day",
    "slot_of_day",
    "day_of_week",
    "is_weekend",
    "temperature_c",
    "rolling_mean_1h",
    "rolling_mean_6h",
    "prev_day_same_slot",
    "prev_week_same_slot",
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), "demand_model.pkl")


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Add rolling/lag features. Expects demand_kw column; sorts by timestamp if present."""
    df = df.copy()
    if "timestamp" in df.columns:
        df["_ts"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("_ts").reset_index(drop=True)
    if "demand_kw" not in df.columns:
        raise ValueError("build_features requires 'demand_kw' column")
    d = df["demand_kw"].astype(float)
    df["rolling_mean_1h"] = d.rolling(window=2, min_periods=1).mean()
    df["rolling_mean_6h"] = d.rolling(window=12, min_periods=1).mean()
    df["prev_day_same_slot"] = d.shift(48).fillna(d.expanding().mean())
    df["prev_week_same_slot"] = d.shift(336).fillna(d.expanding().mean())
    for c in ["hour_of_day", "slot_of_day", "day_of_week", "is_weekend", "temperature_c"]:
        if c not in df.columns:
            raise ValueError(f"build_features requires '{c}' column")
    return df


def _metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    mae = float(np.mean(np.abs(y_true - y_pred)))
    mask = np.abs(y_true) > 1e-6
    mape = float(np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0) if mask.any() else 0.0
    bias = float(np.mean(y_pred - y_true))
    resid_std = float(np.std(y_pred - y_true))
    return {"mae": mae, "mape": mape, "bias": bias, "residual_std": resid_std}


class DemandForecaster:
    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.model: Ridge | None = None
        self.scaler: StandardScaler | None = None
        self.metrics: dict = {}
        self.residual_std: float = 5.0

    def train(self, df: pd.DataFrame) -> dict:
        feat = build_features(df)
        X = feat[FEATURE_COLS].to_numpy(dtype=float)
        y = feat["demand_kw"].to_numpy(dtype=float)
        n = len(X)
        # Time-aware split: last 20% (min 48 rows) is validation — no future leakage.
        n_val = max(48, int(n * 0.2))
        n_train = max(1, n - n_val)
        X_train, X_val = X[:n_train], X[n_train:]
        y_train, y_val = y[:n_train], y[n_train:]
        self.scaler = StandardScaler()
        Xtr = self.scaler.fit_transform(X_train)
        self.model = Ridge(alpha=1.0)
        self.model.fit(Xtr, y_train)
        val_pred = self.model.predict(self.scaler.transform(X_val))
        self.metrics = _metrics(y_val, val_pred)
        self.metrics["n_train"] = int(n_train)
        self.metrics["n_val"] = int(len(X_val))
        self.residual_std = max(2.0, float(self.metrics.get("residual_std", 5.0)))
        return dict(self.metrics)

    def predict_next_48_slots(
        self,
        history_df: pd.DataFrame,
        start_time: datetime | None = None,
        n_slots: int = 48,
    ) -> list[dict]:
        if self.model is None or self.scaler is None:
            raise RuntimeError("Model not trained/loaded. Call train() or load() first.")
        hist = history_df.copy()
        if "timestamp" in hist.columns:
            hist["_ts"] = pd.to_datetime(hist["timestamp"])
            hist = hist.sort_values("_ts").reset_index(drop=True)
        last_ts = pd.to_datetime(hist["_ts"].iloc[-1]) if "_ts" in hist.columns else pd.Timestamp.now()
        if start_time is None:
            start_time = (last_ts + timedelta(minutes=30)).to_pydatetime()
        demands = list(hist["demand_kw"].astype(float).values)
        temps = list(hist["temperature_c"].astype(float).values) if "temperature_c" in hist.columns else [30.0] * len(demands)
        out: list[dict] = []
        t = start_time
        for i in range(n_slots):
            hour = t.hour + t.minute / 60.0
            slot_of_day = (t.hour * 60 + t.minute) // 30
            dow = t.weekday()
            # temperature proxy: same slot previous day else sinusoidal
            if len(temps) >= 48:
                temp = float(temps[-48])
            else:
                temp = float(28 + 8 * math.sin(math.pi * (hour - 6) / 12))
            rm1 = float(np.mean(demands[-2:])) if len(demands) >= 2 else float(demands[-1])
            rm6 = float(np.mean(demands[-12:])) if len(demands) >= 12 else float(np.mean(demands))
            prev_day = float(demands[-48]) if len(demands) >= 48 else rm6
            prev_week = float(demands[-336]) if len(demands) >= 336 else prev_day
            row = np.array([[t.hour, slot_of_day, dow, int(dow >= 5), temp, rm1, rm6, prev_day, prev_week]])
            pred = max(0.0, float(self.model.predict(self.scaler.transform(row))[0]))
            lo = max(0.0, pred - 1.96 * self.residual_std)
            hi = pred + 1.96 * self.residual_std
            out.append({
                "offset_minutes": (i + 1) * 30,
                "forecast_kw": round(pred, 2),
                "confidence_low_kw": round(lo, 2),
                "confidence_high_kw": round(hi, 2),
            })
            demands.append(pred)
            temps.append(temp)
            t = t + timedelta(minutes=30)
        return out

    def save(self, path: str | None = None) -> str:
        path = path or self.model_path
        with open(path, "wb") as f:
            pickle.dump(
                {"model": self.model, "scaler": self.scaler,
                 "metrics": self.metrics, "residual_std": self.residual_std},
                f,
            )
        return path

    def load(self, path: str | None = None) -> bool:
        path = path or self.model_path
        if not os.path.exists(path):
            return False
        with open(path, "rb") as f:
            blob = pickle.load(f)
        self.model = blob["model"]
        self.scaler = blob["scaler"]
        self.metrics = blob.get("metrics", {})
        self.residual_std = blob.get("residual_std", 5.0)
        return True


def fallback_forecast(n_slots: int = 48) -> list[dict]:
    """Deterministic daily-profile fallback when the ML model is unavailable."""
    out = []
    now = datetime.now().replace(minute=0 if datetime.now().minute < 30 else 30, second=0, microsecond=0)
    for i in range(n_slots):
        t = now + timedelta(minutes=30 * (i + 1))
        hour = t.hour + t.minute / 60.0
        morning = math.exp(-0.5 * ((hour - 8.0) / 1.0) ** 2)
        evening = math.exp(-0.5 * ((hour - 19.0) / 1.5) ** 2)
        pred = 80 + 50 * morning + 70 * evening
        out.append({
            "offset_minutes": (i + 1) * 30,
            "forecast_kw": round(pred, 2),
            "confidence_low_kw": round(max(0, pred * 0.8), 2),
            "confidence_high_kw": round(pred * 1.2, 2),
        })
    return out
