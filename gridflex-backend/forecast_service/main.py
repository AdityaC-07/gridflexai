"""Forecast Service: demand (Ridge) + solar (physics) forecasts -> DynamoDB."""
from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timezone

import pandas as pd
from fastapi import FastAPI, HTTPException

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from forecast_service.demand_model import DemandForecaster, build_features, fallback_forecast  # noqa: E402
from forecast_service.solar_model import forecast_solar  # noqa: E402
from shared import dynamo as db  # noqa: E402
from shared.config import settings  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("forecast-service")

app = FastAPI(title="GridFlex Forecast Service")
forecaster = DemandForecaster()
MODEL_READY = False
LAST_FORECAST: dict = {}


def _ensure_model() -> None:
    global MODEL_READY
    if forecaster.load():
        MODEL_READY = True
        logger.info("Loaded saved demand model. metrics=%s", forecaster.metrics)
        return
    csv = os.path.join(os.path.dirname(__file__), "training_data.csv")
    if os.path.exists(csv):
        df = pd.read_csv(csv)
        metrics = forecaster.train(df)
        forecaster.save()
        MODEL_READY = True
        logger.info("Trained demand model from synthetic data. metrics=%s", metrics)
    else:
        MODEL_READY = False
        logger.warning("No training data found; using fallback forecast.")


def _history_df(feeder_id: str) -> pd.DataFrame:
    try:
        rows = db.get_recent_telemetry(feeder_id, limit=336)
    except Exception as exc:
        logger.warning("Telemetry read failed (%s); using training-data history.", exc)
        rows = []
    if rows:
        df = pd.DataFrame([{
            "timestamp": r.get("timestamp"),
            "hour_of_day": pd.to_datetime(r.get("timestamp")).hour,
            "slot_of_day": (pd.to_datetime(r.get("timestamp")).hour * 60
                            + pd.to_datetime(r.get("timestamp")).minute) // 30,
            "day_of_week": pd.to_datetime(r.get("timestamp")).weekday(),
            "is_weekend": int(pd.to_datetime(r.get("timestamp")).weekday() >= 5),
            "temperature_c": r.get("temperature_c", 30.0),
            "demand_kw": r.get("demand_kw", 80.0),
        } for r in reversed(rows)])
        return df
    csv = os.path.join(os.path.dirname(__file__), "training_data.csv")
    return pd.read_csv(csv)


def run_forecast_cycle(feeder_id: str | None = None, cloud_event: dict | None = None) -> dict:
    feeder_id = feeder_id or settings.feeder_id
    logger.info("Forecast cycle for %s", feeder_id)
    hist = _history_df(feeder_id)
    try:
        demand_slots = forecaster.predict_next_48_slots(hist) if MODEL_READY else fallback_forecast()
        used_fallback = not MODEL_READY
    except Exception as exc:
        logger.warning("Demand model failed (%s); using fallback.", exc)
        demand_slots = fallback_forecast()
        used_fallback = True
    ce = cloud_event or {}
    solar_slots = forecast_solar(
        start_time=datetime.now(timezone.utc).replace(tzinfo=None),
        n_slots=48,
        cloud_event_active=bool(ce.get("active", False)),
        cloud_event_severity=float(ce.get("severity", 0.0)),
        cloud_event_start_slot=int(ce.get("start_slot", 0)),
        cloud_event_duration_slots=int(ce.get("duration_slots", 0)),
    )
    doc = {
        "feeder_id": feeder_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "demand": demand_slots,
        "solar": solar_slots,
        "confidence": 0.75 if used_fallback else 0.85,
        "model": "fallback" if used_fallback else "ridge",
    }
    try:
        db.write_forecast(doc)
        logger.info("Forecast stored for %s", feeder_id)
    except Exception as exc:
        logger.warning("Forecast DynamoDB write failed: %s", exc)
    global LAST_FORECAST
    LAST_FORECAST[feeder_id] = doc
    return doc


@app.on_event("startup")
def _startup() -> None:
    _ensure_model()
    logger.info("Forecast service startup complete. model_ready=%s", MODEL_READY)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "forecast", "model_ready": MODEL_READY,
            "metrics": forecaster.metrics}


@app.get("/forecast/{feeder_id}")
def get_forecast(feeder_id: str) -> dict:
    if feeder_id in LAST_FORECAST:
        return LAST_FORECAST[feeder_id]
    try:
        doc = db.get_latest_forecast(feeder_id)
        if doc:
            return doc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Forecast store unavailable: {exc}")
    raise HTTPException(status_code=404, detail=f"No forecast for feeder {feeder_id}; POST /forecast/{feeder_id}/refresh first.")


@app.post("/forecast/{feeder_id}/refresh")
def refresh_forecast(feeder_id: str, body: dict | None = None) -> dict:
    if not feeder_id:
        raise HTTPException(status_code=422, detail="feeder_id required")
    return run_forecast_cycle(feeder_id, (body or {}).get("cloud_event"))
