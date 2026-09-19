"""Grid intelligence service — thin wrapper around existing grid_intelligence modules.

Provides direct Python callable API for the unified process.
All deterministic logic (gap calc, risk engine, flexibility) is unchanged.
"""
from __future__ import annotations

import logging

from app.config import config
from app.core.store import (
    get_latest_telemetry,
    get_latest_forecast,
    get_battery_state,
    write_feeder_state,
)

logger = logging.getLogger("app.services.grid_intelligence")


class GridIntelligenceService:
    """Stateless grid intelligence orchestrator."""

    def evaluate_feeder_state(self, feeder_id: str | None = None) -> dict:
        """Compute the current feeder state in-process.

        Reuses the existing run_intelligence_cycle() from grid_intelligence.main
        but reads/writes through the unified store.

        Returns the feeder state dict (same shape as the existing service).
        """
        from grid_intelligence.main import run_intelligence_cycle
        feeder_id = feeder_id or config.feeder_id
        # run_intelligence_cycle reads from shared.dynamo; in local mode those
        # calls go through app.core.store via our store functions, but the
        # existing code still imports shared.dynamo directly.
        # Strategy: call run_intelligence_cycle (which already has its own
        # fallbacks), then mirror the result to our store.
        state = run_intelligence_cycle(feeder_id)
        if state.get("status") == "OK":
            write_feeder_state(state)
        return state

    def get_feeder_state(self, feeder_id: str) -> dict | None:
        """Return the latest cached feeder state without triggering a cycle."""
        from app.core.store import get_latest_feeder_state
        return get_latest_feeder_state(feeder_id)

    def list_feeders(self) -> list[str]:
        return [config.feeder_id]


# Module-level singleton
grid_service = GridIntelligenceService()
