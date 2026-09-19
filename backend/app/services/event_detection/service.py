"""Event detection service — wraps grid_intelligence.event_detection."""
from __future__ import annotations

import logging

from app.config import config

logger = logging.getLogger("app.services.event_detection")


class EventDetectionService:
    """Checks feeder state and creates reliability events when criteria are met."""

    def check_and_create_event(self, feeder_id: str) -> dict | None:
        """Evaluate the latest feeder state; create an event if thresholds are met.

        Returns the newly created event dict, or None if no event was triggered.
        """
        from grid_intelligence.event_detection import check_and_create_event
        return check_and_create_event(feeder_id)

    def detect_from_state(self, feeder_id: str, feeder_state: dict, forecast: dict | None = None) -> dict | None:
        """Run detection directly from a feeder state dict (for simulation)."""
        from grid_intelligence.event_detection import detect_reliability_event
        return detect_reliability_event(feeder_id, feeder_state, forecast)


# Module-level singleton
event_detection_service = EventDetectionService()
