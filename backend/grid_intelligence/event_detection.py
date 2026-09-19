"""Reliability Event Detection: forecast gap + risk -> create reliability events."""
from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from shared import dynamo as db
from shared.config import settings

logger = logging.getLogger("grid-intelligence.event-detection")

# Event detection thresholds
EVENT_GAP_THRESHOLD_KW = 20.0
EVENT_DURATION_THRESHOLD_MINUTES = 30
EVENT_RISK_LEVELS = ["HIGH", "CRITICAL"]


def detect_reliability_event(feeder_id: str, feeder_state: dict[str, Any], forecast: dict[str, Any] | None = None) -> dict[str, Any] | None:
    """Detect if a reliability event should be created based on current conditions.

    Returns the created event dict if detection criteria are met, None otherwise.
    """
    risk_level = feeder_state.get("risk_level", "LOW")
    predicted_gap = feeder_state.get("peak_gap_next_4h_kw", feeder_state.get("net_gap_kw", 0.0))
    critical_load = settings.critical_load_kw

    # Check detection criteria
    if risk_level not in EVENT_RISK_LEVELS:
        logger.info("Risk level %s not in trigger levels %s", risk_level, EVENT_RISK_LEVELS)
        return None

    if predicted_gap < EVENT_GAP_THRESHOLD_KW:
        logger.info("Predicted gap %.2f kW below threshold %.2f kW", predicted_gap, EVENT_GAP_THRESHOLD_KW)
        return None

    # Estimate duration from forecast (find first slot where gap exists)
    duration_minutes = 30  # default minimum
    if forecast and forecast.get("demand") and forecast.get("solar"):
        demand_slots = forecast.get("demand", [])[:8]
        solar_slots = forecast.get("solar", [])[:8]
        gap_slots = 0
        for d, s in zip(demand_slots, solar_slots):
            gap = float(d.get("forecast_kw", 0)) - float(s.get("forecast_kw", 0)) - settings.grid_import_limit_kw
            if gap > 0:
                gap_slots += 1
        if gap_slots > 0:
            duration_minutes = gap_slots * 30  # 30-minute slots

    if duration_minutes < EVENT_DURATION_THRESHOLD_MINUTES:
        logger.info("Duration %d min below threshold %d min", duration_minutes, EVENT_DURATION_THRESHOLD_MINUTES)
        return None

    # Check if critical load is at risk
    if predicted_gap < critical_load:
        logger.info("Gap %.2f kW below critical load %.2f kW", predicted_gap, critical_load)
        return None

    # Assemble flexibility pool
    try:
        pool = db.get_feeder_flexibility_pool(feeder_id)
        flexibility_available = sum(float(r.get("available_kw", 0)) for r in pool)
    except Exception as exc:
        logger.warning("Failed to get flexibility pool: %s", exc)
        flexibility_available = 0.0

    forecast_confidence = feeder_state.get("forecast_confidence", 0.75)

    # Generate event ID
    timestamp = datetime.now(timezone.utc)
    event_id = f"GF-{feeder_id.upper()}-{timestamp.strftime('%Y%m%d-%H%M')}"

    # Calculate time to event (use first gap slot from forecast)
    time_to_event_minutes = 45  # default
    if forecast and forecast.get("demand"):
        first_slot = forecast.get("demand", [{}])[0]
        if first_slot.get("offset_minutes"):
            time_to_event_minutes = first_slot.get("offset_minutes", 45)

    event = {
        "event_id": event_id,
        "feeder_id": feeder_id,
        "status": "PREDICTED",
        "predicted_gap_kw": round(predicted_gap, 2),
        "duration_minutes": duration_minutes,
        "risk_level": risk_level,
        "critical_load_kw": critical_load,
        "flexibility_available_kw": round(flexibility_available, 2),
        "dispatch_plan": None,  # Will be populated by optimization service
        "battery_reserve_after_pct": None,  # Will be populated by optimization service
        "forecast_confidence": round(forecast_confidence, 2),
        "created_at": timestamp.isoformat(),
        "approved_at": None,
        "verified_at": None,
        "outcome": None,
        "time_to_event_minutes": time_to_event_minutes,
    }

    try:
        db.write_reliability_event(event)
        logger.info("Created reliability event %s for feeder %s", event_id, feeder_id)

        # Send SNS alert for HIGH/CRITICAL events
        try:
            from grid_intelligence.sns_alerts import send_reliability_event_alert
            send_reliability_event_alert(event)
        except Exception as exc:
            logger.warning("Failed to send SNS alert: %s", exc)

        return event
    except Exception as exc:
        logger.error("Failed to write reliability event: %s", exc)
        return None


def check_and_create_event(feeder_id: str) -> dict[str, Any] | None:
    """Check current feeder state and create event if criteria are met."""
    try:
        state = db.get_latest_feeder_state(feeder_id)
    except Exception as exc:
        logger.warning("Failed to get feeder state: %s", exc)
        return None

    if not state or state.get("status") != "OK":
        logger.info("Feeder state not available or not OK")
        return None

    try:
        forecast = db.get_latest_forecast(feeder_id)
    except Exception as exc:
        logger.warning("Failed to get forecast: %s", exc)
        forecast = None

    # Check if there's already an active event for this feeder
    try:
        active_events = db.get_active_reliability_events(feeder_id)
        if active_events:
            logger.info("Active events already exist for feeder %s, skipping detection", feeder_id)
            return None
    except Exception as exc:
        logger.warning("Failed to check active events: %s", exc)

    return detect_reliability_event(feeder_id, state, forecast)
