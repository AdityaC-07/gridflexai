"""Optimization Service: LP (+heuristic fallback) + policy + explainer -> decision."""
from __future__ import annotations

import logging
import os
import sys
import uuid
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from optimization_service.explainer import generate_explanation  # noqa: E402
from optimization_service.heuristic import optimize_with_fallback  # noqa: E402
from optimization_service.policy_layer import apply_policy  # noqa: E402
from shared import dynamo as db  # noqa: E402
from shared.config import settings  # noqa: E402

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("optimization-service")

app = FastAPI(title="GridFlex Optimization Service")
MEMORY: dict[str, dict] = {}


class RunRequest(BaseModel):
    feeder_id: str = "F01"


def _slot_vals(slots: list[dict] | None, key: str = "forecast_kw", default: float = 0.0) -> list[float]:
    if not slots:
        return []
    return [float(s.get(key, default)) for s in slots]


def run_optimization_cycle(feeder_id: str) -> dict:
    logger.info("Optimization run for %s", feeder_id)
    try:
        state = db.get_latest_feeder_state(feeder_id)
    except Exception as exc:
        logger.warning("Feeder-state read failed: %s", exc)
        state = None
    try:
        forecast = db.get_latest_forecast(feeder_id)
    except Exception as exc:
        logger.warning("Forecast read failed: %s", exc)
        forecast = None
    try:
        battery = db.get_battery_state(feeder_id)
    except Exception as exc:
        logger.warning("Battery read failed: %s", exc)
        battery = {"soc_pct": 80.0, "soc_kwh": settings.battery_capacity_kwh * 0.8}
    if forecast is None:
        # Offline/demo fallback: reuse the in-process forecast cache.
        try:
            from forecast_service.main import LAST_FORECAST as _LF
            forecast = _LF.get(feeder_id)
        except Exception:
            forecast = None
    if state is None or state.get("status") != "OK":
        try:
            from grid_intelligence.main import run_intelligence_cycle
            live = run_intelligence_cycle(feeder_id)
            if live.get("status") == "OK":
                state = live
        except Exception as exc:
            logger.warning("Live intelligence fallback failed: %s", exc)

    n = settings.optimization_horizon_slots
    if forecast and forecast.get("demand"):
        demand = _slot_vals(forecast["demand"][:n], "forecast_kw", 80.0)
        solar = _slot_vals((forecast.get("solar") or [])[:n], "forecast_kw", 0.0)
        confidence = float(forecast.get("confidence", 0.75))
    elif state:
        demand = [float(state.get("demand_kw", 80.0))] * n
        solar = [float(state.get("solar_kw", 0.0))] * n
        confidence = float(state.get("forecast_confidence", 0.75))
    else:
        raise RuntimeError(f"No feeder state or forecast for {feeder_id}; refresh forecast first.")
    if not state:
        state = {"feeder_id": feeder_id, "risk_level": "UNKNOWN", "stress_index": 0,
                 "net_gap_kw": 0, "total_flexible_kw": 20.0, "recommended_action": "MONITOR",
                 "demand_kw": demand[0], "solar_kw": solar[0]}
    flex_kw = float(state.get("total_flexible_kw", 20.0))
    soc_kwh = float(battery.get("soc_kwh", settings.battery_capacity_kwh * 0.8))

    opt = optimize_with_fallback(
        demand, solar, soc_kwh, flex_kw, settings.grid_import_limit_kw,
        settings.battery_capacity_kwh, settings.battery_reserve_pct,
        settings.battery_max_discharge_kw, settings.critical_load_kw,
    )
    logger.info("Optimizer used %s; unserved=%s kWh", opt["method"], opt["total_unserved_kwh"])
    soc_after_kwh = max(0.0, soc_kwh - opt["battery_energy_used_kwh"])
    soc_after_pct = soc_after_kwh / settings.battery_capacity_kwh * 100.0
    policy = apply_policy(opt, confidence, round(soc_after_pct, 2))
    explanation = generate_explanation(state, opt, policy)
    decision = {
        "decision_id": f"D-{uuid.uuid4().hex[:8].upper()}",
        "feeder_id": feeder_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "optimization": opt,
        "policy": policy,
        "explanation": explanation,
        "status": "BLOCKED" if not policy["hard_checks_passed"] else "PENDING_APPROVAL",
    }
    MEMORY[decision["decision_id"]] = decision
    try:
        db.write_decision(decision)
    except Exception as exc:
        logger.warning("Decision write failed: %s", exc)
    return decision


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "optimization"}


@app.post("/optimization/run")
def run_opt(body: RunRequest) -> dict:
    try:
        return run_optimization_cycle(body.feeder_id)
    except RuntimeError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {exc}")


@app.get("/optimization/{decision_id}")
def get_opt(decision_id: str, feeder_id: str | None = None) -> dict:
    if decision_id in MEMORY:
        return MEMORY[decision_id]
    try:
        doc = db.get_decision(decision_id, feeder_id)
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Decision store unavailable: {exc}")
    if not doc:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found.")
    return doc


@app.post("/optimization/{decision_id}/approve")
def approve_opt(decision_id: str, body: dict | None = None) -> dict:
    feeder_id = (body or {}).get("feeder_id")
    doc = MEMORY.get(decision_id)
    if doc is None:
        try:
            doc = db.get_decision(decision_id, feeder_id)
        except Exception as exc:
            raise HTTPException(status_code=503, detail=f"Decision store unavailable: {exc}")
    if not doc:
        raise HTTPException(status_code=404, detail=f"Decision {decision_id} not found.")
    if doc.get("status") == "BLOCKED":
        raise HTTPException(status_code=409, detail="Decision blocked by policy; cannot approve.")
    doc["status"] = "APPROVED"
    doc["approved_at"] = datetime.now(timezone.utc).isoformat()
    doc["approved_by"] = (body or {}).get("approved_by", "operator")
    MEMORY[decision_id] = doc
    try:
        db.write_decision(doc)
    except Exception as exc:
        logger.warning("Decision approval write failed: %s", exc)
    return doc
