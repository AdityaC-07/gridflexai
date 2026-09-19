"""GridFlex Reliability Copilot - AI-powered explanation and simulation agent.

This is a constrained LLM agent that operates exclusively in explanation and simulation mode.
It reads live DynamoDB state and explains what is happening. It never writes dispatch commands.
"""
from __future__ import annotations

import logging
import os
import sys

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared import dynamo as db
from shared.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("copilot-service")

app = FastAPI(title="GridFlex Reliability Copilot")


class CopilotRequest(BaseModel):
    question: str
    feeder_id: str = "F01"
    event_id: str | None = None


class CopilotResponse(BaseModel):
    question: str
    answer: str
    context: dict
    sources: list[str]


def get_feeder_context(feeder_id: str) -> dict:
    """Gather current feeder state context for the copilot."""
    context = {"feeder_id": feeder_id}

    try:
        state = db.get_latest_feeder_state(feeder_id)
        if state:
            context["feeder_state"] = {
                "demand_kw": state.get("demand_kw"),
                "solar_kw": state.get("solar_kw"),
                "risk_level": state.get("risk_level"),
                "stress_index": state.get("stress_index"),
                "net_gap_kw": state.get("net_gap_kw"),
                "battery_soc_pct": state.get("battery_soc_pct"),
            }
    except Exception as exc:
        logger.warning("Failed to get feeder state: %s", exc)

    try:
        forecast = db.get_latest_forecast(feeder_id)
        if forecast:
            context["forecast"] = {
                "confidence": forecast.get("confidence"),
                "demand_slots": len(forecast.get("demand", [])),
                "solar_slots": len(forecast.get("solar", [])),
            }
    except Exception as exc:
        logger.warning("Failed to get forecast: %s", exc)

    try:
        active_events = db.get_active_reliability_events(feeder_id)
        if active_events:
            context["active_events"] = [
                {
                    "event_id": e.get("event_id"),
                    "status": e.get("status"),
                    "risk_level": e.get("risk_level"),
                    "predicted_gap_kw": e.get("predicted_gap_kw"),
                }
                for e in active_events[:3]
            ]
    except Exception as exc:
        logger.warning("Failed to get active events: %s", exc)

    try:
        pool = db.get_feeder_flexibility_pool(feeder_id)
        if pool:
            context["flexibility_pool"] = {
                "total_resources": len(pool),
                "total_available_kw": sum(float(r.get("available_kw", 0)) for r in pool),
            }
    except Exception as exc:
        logger.warning("Failed to get flexibility pool: %s", exc)

    return context


def generate_explanation(question: str, context: dict) -> str:
    """Generate explanation for the user's question based on context.

    This is a simplified rule-based explanation system. In production,
    this would use an LLM (e.g., Claude via Bedrock) with proper grounding.
    """
    question_lower = question.lower()
    feeder_state = context.get("feeder_state", {})
    active_events = context.get("active_events", [])

    # Risk-related questions
    if "risk" in question_lower or "why" in question_lower:
        risk_level = feeder_state.get("risk_level", "LOW")
        stress_index = feeder_state.get("stress_index", 0)
        gap = feeder_state.get("net_gap_kw", 0)

        if risk_level == "HIGH":
            return (
                f"Feeder is at HIGH risk (stress index: {stress_index}/100). "
                f"This is due to an energy gap of {gap} kW between demand and available supply. "
                f"The gap cannot be covered by current renewable generation and grid import limits. "
                f"Critical loads are protected, but non-critical loads may be affected without intervention."
            )
        elif risk_level == "CRITICAL":
            return (
                f"Feeder is at CRITICAL risk (stress index: {stress_index}/100). "
                f"There is a significant energy gap of {gap} kW that threatens reliability. "
                f"Immediate action is required to protect critical infrastructure. "
                f"The system has already triggered a reliability event to manage this situation."
            )
        else:
            return (
                f"Feeder is currently at {risk_level} risk (stress index: {stress_index}/100). "
                f"Grid conditions are stable with no significant energy gaps. "
                f"Normal monitoring is sufficient."
            )

    # Event-related questions
    if "event" in question_lower:
        if active_events:
            event = active_events[0]
            return (
                f"There is an active reliability event ({event['event_id']}). "
                f"Status: {event['status']}, Risk Level: {event['risk_level']}, "
                f"Predicted Gap: {event['predicted_gap_kw']} kW. "
                f"The system has assembled a flexibility pool to address this gap. "
                f"Operator approval is required for dispatch."
            )
        else:
            return "There are currently no active reliability events. The feeder is operating normally."

    # Battery-related questions
    if "battery" in question_lower:
        soc = feeder_state.get("battery_soc_pct", 0)
        return (
            f"Community battery is currently at {soc}% state of charge. "
            f"The battery is available to cover energy gaps and protect critical loads. "
            f"GridFlex maintains a 20% reserve for emergency situations."
        )

    # Flexibility pool questions
    if "flexibility" in question_lower or "pool" in question_lower or "resources" in question_lower:
        pool_info = context.get("flexibility_pool", {})
        return (
            f"The flexibility pool contains {pool_info.get('total_resources', 0)} community resources "
            f"with a total of {pool_info.get('total_available_kw', 0)} kW available. "
            f"Resources include community battery, EV charging, HVAC systems, water pumps, and more. "
            f"Each resource is ranked by Reliability Budget Score to minimize community disruption."
        )

    # Default response
    return (
        "I can help explain feeder conditions, reliability events, flexibility resources, and optimization decisions. "
        "Try asking about the current risk level, active events, battery status, or available flexibility resources."
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "copilot"}


@app.post("/copilot/ask")
def ask_copilot(request: CopilotRequest) -> dict:
    """Ask the copilot a question about the current grid state."""
    try:
        context = get_feeder_context(request.feeder_id)

        if request.event_id:
            try:
                event = db.get_reliability_event(request.event_id)
                if event:
                    context["event"] = {
                        "event_id": event.get("event_id"),
                        "status": event.get("status"),
                        "dispatch_plan": event.get("dispatch_plan"),
                    }
            except Exception as exc:
                logger.warning("Failed to get event %s: %s", request.event_id, exc)

        answer = generate_explanation(request.question, context)

        sources = []
        if "feeder_state" in context:
            sources.append("gridflex-feeder-state")
        if "active_events" in context:
            sources.append("gridflex-reliability-events")
        if "flexibility_pool" in context:
            sources.append("gridflex-flexibility-pool")

        response = CopilotResponse(
            question=request.question,
            answer=answer,
            context=context,
            sources=sources,
        )

        logger.info("Copilot answered question about feeder %s", request.feeder_id)
        return response.dict()

    except Exception as exc:
        logger.error("Copilot failed to answer question: %s", exc)
        raise HTTPException(status_code=500, detail=f"Copilot error: {exc}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
