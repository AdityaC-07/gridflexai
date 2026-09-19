"""Forecast service — thin wrapper around the existing forecast_service modules.

This module exposes a clean Python API so routers and other services can call
forecast logic directly without going through HTTP.  The underlying Ridge
regression model and solar physics model are unchanged.
"""
from __future__ import annotations

import logging
import os

import pandas as pd

from app.config import config
from app.core.store import write_forecast, get_latest_forecast

logger = logging.getLogger("app.services.forecast")

# ── Lazy model initialisation ─────────────────────────────────────────────────
# We import from the existing forecast_service package which already contains
# the trained model, fallback logic, and solar physics.  We do NOT re-implement
# any of that logic here — we only re-route calls through the unified store.

_forecaster = None
_model_ready = False


def _ensure_model() -> None:
    global _forecaster, _model_ready
    if _forecaster is not None:
        return
    from forecast_service.demand_model import DemandForecaster
    _forecaster = DemandForecaster()
    if _forecaster.load():
        _model_ready = True
        logger.info("Demand model loaded. metrics=%s", _forecaster.metrics)
        return
    csv = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "..", "..", "forecast_service", "training_data.csv",
    )
    if os.path.exists(csv):
        df = pd.read_csv(csv)
        metrics = _forecaster.train(df)
        _forecaster.save()
        _model_ready = True
        logger.info("Demand model trained. metrics=%s", metrics)
    else:
        _model_ready = False
        logger.warning("No training_data.csv; falling back to statistical forecast.")


def _history_df(feeder_id: str) -> pd.DataFrame:
    from app.core.store import get_recent_telemetry
    rows = get_recent_telemetry(feeder_id, limit=336)
    if rows:
        return pd.DataFrame([{
            "timestamp": r.get("timestamp"),
            "hour_of_day": pd.to_datetime(r.get("timestamp")).hour,
            "slot_of_day": (
                pd.to_datetime(r.get("timestamp")).hour * 60
                + pd.to_datetime(r.get("timestamp")).minute
            ) // 30,
            "day_of_week": pd.to_datetime(r.get("timestamp")).weekday(),
            "is_weekend": int(pd.to_datetime(r.get("timestamp")).weekday() >= 5),
            "temperature_c": r.get("temperature_c", 30.0),
            "demand_kw": r.get("demand_kw", 80.0),
        } for r in reversed(rows)])
    csv = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "..", "..", "forecast_service", "training_data.csv",
    )
    return pd.read_csv(csv)


class ForecastService:
    """Stateless forecast orchestrator.  Call generate_forecast() to run a cycle."""

    # In-memory cache: feeder_id → latest forecast dict.
    # Used as a cross-service fallback when the store is unavailable.
    _cache: dict[str, dict] = {}

    def startup(self) -> None:
        """Called once at app startup to warm the model."""
        _ensure_model()

    @property
    def model_ready(self) -> bool:
        return _model_ready

    @property
    def model_metrics(self) -> dict:
        if _forecaster and _model_ready:
            return _forecaster.metrics or {}
        return {}

    def generate_forecast(
        self,
        feeder_id: str | None = None,
        cloud_event: dict | None = None,
    ) -> dict:
        """Run a full forecast cycle and persist the result.

        Parameters
        ----------
        feeder_id:    Feeder to forecast for (defaults to config.feeder_id).
        cloud_event:  Optional cloud-cover event dict used by the solar model.
                      Keys: active (bool), severity (float 0-1),
                            start_slot (int), duration_slots (int).

        Returns
        -------
        Full forecast document (same shape as the existing service).
        """
        # Delegate entirely to the existing run_forecast_cycle, but use the
        # unified store instead of calling DynamoDB directly.
        from forecast_service.main import run_forecast_cycle
        # run_forecast_cycle uses ``shared.dynamo`` internally for persistence.
        # In local mode we intercept the write below (store.write_forecast is
        # already patched at import time via app.core.store).
        feeder_id = feeder_id or config.feeder_id
        doc = run_forecast_cycle(feeder_id, cloud_event)
        # Ensure our store has the result regardless of DynamoDB availability.
        write_forecast(doc)
        ForecastService._cache[feeder_id] = doc
        return doc

    def get_forecast(self, feeder_id: str) -> dict | None:
        """Return the latest forecast from the store, then the in-memory cache."""
        doc = get_latest_forecast(feeder_id)
        if doc:
            return doc
        return ForecastService._cache.get(feeder_id)


# Module-level singleton used by routers and other services.
forecast_service = ForecastService()
