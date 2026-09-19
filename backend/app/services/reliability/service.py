"""Reliability service — metrics computation and event lifecycle management.

DETERMINISM GUARANTEE
─────────────────────
• compute_reliability_metrics()  — pure function, no randomness.
• verify_event_outcome()         — uses random.uniform for simulated compliance
  (MVP placeholder; production would use real meter readings).
• All dispatch approval logic is purely deterministic rule evaluation.
"""
from __future__ import annotations

import logging
import random
from datetime import datetime, timezone

from app.config import config
from app.core.store import (
    get_latest_feeder_state,
    get_latest_decision,
    get_reliability_event,
    write_reliability_event,
    get_active_reliability_events,
    get_recent_reliability_events,
)

logger = logging.getLogger("app.services.reliability")


class ReliabilityService:
    """Computes baseline-vs-GridFlex reliability metrics and manages event lifecycle."""

    def calculate_metrics(self, feeder_id: str) -> dict:
        """Derive reliability metrics from the latest decision + feeder state."""
        from reliability_metrics import compute_reliability_metrics

        decision = get_latest_decision(feeder_id)
        gridflex_kw = (decision or {}).get("optimization", {}).get("unserved_kw", [0.0] * 8)

        state = get_latest_feeder_state(feeder_id)
        gap = float((state or {}).get(
            "peak_gap_next_4h_kw",
            (state or {}).get("net_gap_kw", 0.0)
        ))
        baseline_kw = [gap] * len(gridflex_kw) if gridflex_kw else [gap] * 8

        metrics = compute_reliability_metrics(
            baseline_kw,
            gridflex_kw or [0.0] * 8,
            battery_energy_used_kwh=float(
                (decision or {}).get("optimization", {}).get("battery_energy_used_kwh", 0.0)
            ),
        )
        return {"feeder_id": feeder_id, **metrics}

    def approve_event(self, event_id: str, approved_by: str = "operator") -> dict:
        """Transition event status: PREDICTED → OPERATOR_APPROVED."""
        event = get_reliability_event(event_id)
        if not event:
            raise KeyError(f"Reliability event {event_id} not found")
        if event.get("status") != "PREDICTED":
            raise RuntimeError(f"Cannot approve event with status {event.get('status')}")
        event["status"] = "OPERATOR_APPROVED"
        event["approved_at"] = datetime.now(timezone.utc).isoformat()
        event["approved_by"] = approved_by
        updated = write_reliability_event(event)
        logger.info("Approved reliability event %s by %s", event_id, approved_by)
        return updated

    def verify_event(self, event_id: str) -> dict:
        """Verify a dispatched event — simulates compliance for MVP.

        In production this would read real smart-meter data.
        The simulation is clearly labelled in the response.
        """
        from verification_service.main import verify_event_outcome
        try:
            return verify_event_outcome(event_id)
        except Exception as exc:
            logger.error("Verification failed for event %s: %s", event_id, exc)
            raise

    def get_event(self, event_id: str) -> dict | None:
        return get_reliability_event(event_id)

    def list_events(
        self,
        feeder_id: str | None = None,
        active_only: bool = False,
    ) -> list[dict]:
        if active_only:
            return get_active_reliability_events(feeder_id)
        return get_recent_reliability_events(feeder_id)


# Module-level singleton
reliability_service = ReliabilityService()
