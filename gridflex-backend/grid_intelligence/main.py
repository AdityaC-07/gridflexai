"""Grid Intelligence Service: gap + stress/risk + flexibility -> feeder state."""
from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timezone

import pandas as pd
from fastapi import FastAPI, HTTPException

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from grid_intelligence.flexibility import calculate_flexibility  # noqa: E402
from grid_intelligence.gap_calculator import calculate_gap  # noqa: E402
from grid_intelligence.risk_engine import (  # noqa: E402
    classify_risk,
    compute_stress_index,
    recommended_action,
)
from shared import dynamo as db  # noqa: E402
from shared.config import settings  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("grid-intelligence")

app = FastAPI(title="GridFlex Grid Intelligence Service")


def run_intelligence_cycle(feeder_id: str | None = None) -> dict:
    feeder_id = feeder_id or settings.feeder_id
    logger.info("Intelligence cycle for %s", feeder_id)
    try:
        telemetry = db.get_latest_telemetry(feeder_id)
    except Exception as exc:
        logger.warning("Telemetry read failed: %s", exc)
        telemetry = None
    try:
        forecast = db.get_latest_forecast(feeder_id)
    except Exception as exc:
        logger.warning("Forecast read failed: %s", exc)
        forecast = None
    if forecast is None:
        # Offline/demo fallback: reuse the in-process forecast cache so the
        # pipeline works even when DynamoDB is unreachable.
        try:
            from forecast_service.main import LAST_FORECAST as _LF
            forecast = _LF.get(feeder_id)
        except Exception:
            forecast = None
    try:
        battery = db.get_battery_state(feeder_id)
    except Exception as exc:
        logger.warning("Battery read failed: %s", exc)
        battery = {"soc_pct": 80.0, "soc_kwh": settings.battery_capacity_kwh * 0.8,
                   "capacity_kwh": settings.battery_capacity_kwh}

    if telemetry is None and forecast is None:
        state = {
            "feeder_id": feeder_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "UNAVAILABLE",
            "message": "No telemetry or forecast available; intelligence cycle waiting for data.",
            "risk_level": "LOW",
        }
        logger.warning("No data for %s; returning UNAVAILABLE state.", feeder_id)
        return state

    demand = float((telemetry or {}).get("demand_kw")
                   or ((forecast or {}).get("demand") or [{}])[0].get("forecast_kw", 80.0))
    solar = float((telemetry or {}).get("solar_kw")
                  or ((forecast or {}).get("solar") or [{}])[0].get("forecast_kw", 0.0))
    soc_pct = float((telemetry or {}).get("battery_soc_pct", battery.get("soc_pct", 80.0)))
    soc_kwh = float((telemetry or {}).get("battery_soc_kwh",
                                         battery.get("soc_kwh", settings.battery_capacity_kwh * 0.8)))

    gap = calculate_gap(demand, solar, settings.grid_import_limit_kw, soc_kwh,
                        settings.battery_capacity_kwh, settings.battery_max_discharge_kw,
                        settings.battery_reserve_pct, settings.gap_threshold_kw)

    # next-4h peak gap from forecast (8 slots)
    peak_gap = gap["gross_gap_kw"]
    demand_series = [demand]
    if forecast and forecast.get("demand") and forecast.get("solar"):
        d_slots = (forecast["demand"] or [])[:8]
        s_slots = (forecast["solar"] or [])[:8]
        gaps = [max(0.0, float(d.get("forecast_kw", 0)) - float(s.get("forecast_kw", 0))
                    - settings.grid_import_limit_kw)
                for d, s in zip(d_slots, s_slots)]
        if gaps:
            peak_gap = round(max(gaps), 2)
            demand_series = [float(d.get("forecast_kw", demand)) for d in d_slots]
    peak_demand = max(demand_series) if demand_series else demand
    roc = (demand_series[1] - demand_series[0]) * 2.0 if len(demand_series) > 1 else 0.0
    confidence = float((forecast or {}).get("confidence", 0.75))

    stress = compute_stress_index(gap["net_gap_kw"], peak_demand, soc_pct, roc, confidence)
    risk = classify_risk(stress)
    flex = calculate_flexibility()

    state = {
        "feeder_id": feeder_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "demand_kw": round(demand, 2),
        "solar_kw": round(solar, 2),
        "grid_import_limit_kw": settings.grid_import_limit_kw,
        "battery_soc_pct": round(soc_pct, 2),
        "battery_soc_kwh": round(soc_kwh, 2),
        "gross_gap_kw": gap["gross_gap_kw"],
        "battery_coverage_kw": gap["battery_coverage_kw"],
        "net_gap_kw": gap["net_gap_kw"],
        "has_gap": gap["has_gap"],
        "peak_gap_next_4h_kw": peak_gap,
        "peak_demand_kw": round(peak_demand, 2),
        "stress_index": stress,
        "risk_level": risk,
        "total_flexible_kw": flex["total_flexible_kw"],
        "load_breakdown": flex["load_breakdown"],
        "recommended_action": recommended_action(risk),
        "forecast_confidence": confidence,
        "status": "OK",
    }
    try:
        db.write_feeder_state(state)
    except Exception as exc:
        logger.warning("Feeder-state write failed: %s", exc)
    return state


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "grid-intelligence"}


@app.get("/feeder/{feeder_id}/state")
def feeder_state(feeder_id: str) -> dict:
    try:
        cached = db.get_latest_feeder_state(feeder_id)
    except Exception:
        cached = None
    if cached and cached.get("status") == "OK":
        return cached
    # compute live (works even when Dynamo is empty via UNAVAILABLE/fallback path)
    try:
        return run_intelligence_cycle(feeder_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Intelligence cycle failed: {exc}")


@app.get("/feeders")
def feeders() -> dict:
    return {"feeders": [settings.feeder_id]}
