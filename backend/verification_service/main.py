"""Verification Service: Compare dispatch plan vs actual telemetry after event completion."""
from __future__ import annotations

import logging
import os
import sys
from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared import dynamo as db
from shared.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verification-service")

app = FastAPI(title="GridFlex Verification Service")


def verify_event_outcome(event_id: str) -> dict:
    """Verify a reliability event by comparing planned vs actual dispatch.

    This is a simplified verification that compares the dispatch plan against
    simulated/actual telemetry. In production, this would use real meter data.
    """
    logger.info("Verifying event %s", event_id)

    try:
        event = db.get_reliability_event(event_id)
        if not event:
            raise ValueError(f"Event {event_id} not found")

        if event.get("status") not in ["DISPATCHED", "VERIFYING"]:
            raise ValueError(f"Event status must be DISPATCHED or VERIFYING, got {event.get('status')}")

        dispatch_plan = event.get("dispatch_plan")
        if not dispatch_plan:
            raise ValueError("No dispatch plan found for event")

        resources = dispatch_plan.get("resources", [])
        planned_total = dispatch_plan.get("total_dispatch_kw", 0)
        predicted_gap = event.get("predicted_gap_kw", 0)

        # Simulate actual dispatch (in production, this would come from real telemetry)
        # For MVP, we assume 95% compliance on average
        actual_dispatch = {}
        total_actual = 0.0

        for resource in resources:
            resource_id = resource.get("resource_id")
            planned_kw = resource.get("dispatch_kw", 0)

            # Simulate compliance with some variation
            import random
            compliance = random.uniform(0.85, 0.98)
            actual_kw = planned_kw * compliance

            actual_dispatch[resource_id] = actual_kw
            total_actual += actual_kw

        # Calculate unserved energy
        actual_unserved = max(0.0, predicted_gap - total_actual)
        actual_unserved_kwh = (actual_unserved * event.get("duration_minutes", 30)) / 60.0

        # Calculate battery SOC after event
        battery_energy_used = dispatch_plan.get("battery_energy_used_kwh", 0)
        battery_capacity = settings.battery_capacity_kwh
        initial_soc = battery_capacity * 0.8  # Assume 80% initial
        final_soc_kwh = max(battery_capacity * settings.battery_reserve_pct / 100, initial_soc - battery_energy_used)
        final_soc_pct = (final_soc_kwh / battery_capacity) * 100.0

        # Calculate SAIDI impact (simplified)
        # SAIDI = total interruption duration / number of customers served
        # Assuming event would have caused outage without intervention
        saidi_avoided_hours = (actual_unserved_kwh / predicted_gap) * (event.get("duration_minutes", 30) / 60.0) if predicted_gap > 0 else 0

        # Calculate community reliability score
        community_score = int(total_actual / 10)  # Simple scoring: 1 point per 10 kW contributed

        outcome = {
            "actual_dispatch": actual_dispatch,
            "total_actual_dispatch_kw": round(total_actual, 2),
            "actual_unserved_energy_kwh": round(actual_unserved_kwh, 2),
            "battery_soc_final_pct": round(final_soc_pct, 2),
            "saidi_avoided_hours": round(saidi_avoided_hours, 2),
            "community_score": community_score,
            "verified_at": datetime.now(timezone.utc).isoformat(),
        }

        # Update event status
        event["status"] = "VERIFIED"
        event["verified_at"] = outcome["verified_at"]
        event["outcome"] = outcome
        # Ensure timestamp is preserved (required for DynamoDB sort key)
        if "timestamp" not in event:
            event["timestamp"] = event.get("created_at", datetime.now(timezone.utc).isoformat())

        db.write_reliability_event(event)
        logger.info("Event %s verified successfully", event_id)

        return {
            "event_id": event_id,
            "verification_result": outcome,
            "status": "VERIFIED"
        }

    except Exception as exc:
        logger.error("Verification failed for event %s: %s", event_id, exc)
        raise


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "verification"}


@app.post("/verify/{event_id}")
def verify_event(event_id: str) -> dict:
    """Trigger verification for a specific reliability event."""
    try:
        return verify_event_outcome(event_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Verification failed: {exc}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
