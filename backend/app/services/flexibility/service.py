"""Flexibility pool service — direct Python API over pool_assembly."""
from __future__ import annotations

import logging

from app.config import config
from app.core.store import get_latest_feeder_state

logger = logging.getLogger("app.services.flexibility")


class FlexibilityService:
    """Assembles and ranks the flexibility pool for a feeder."""

    def get_pool(self, feeder_id: str) -> dict:
        """Return the assembled, ranked flexibility pool.

        Gap kW is read from the latest feeder state; if unavailable defaults to 0.
        """
        from grid_intelligence.pool_assembly import assemble_flexibility_pool
        state = get_latest_feeder_state(feeder_id)
        gap_kw = float(
            (state or {}).get(
                "peak_gap_next_4h_kw",
                (state or {}).get("net_gap_kw", 0.0)
            )
        )
        return assemble_flexibility_pool(feeder_id, gap_kw)

    def get_raw_pool(self, feeder_id: str) -> list[dict]:
        """Return unranked raw pool entries from the store."""
        from app.core.store import get_feeder_flexibility_pool
        return get_feeder_flexibility_pool(feeder_id)


# Module-level singleton
flexibility_service = FlexibilityService()
