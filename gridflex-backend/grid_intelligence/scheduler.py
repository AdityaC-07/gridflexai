"""APScheduler wrapper for grid-intelligence cycle (every 15 min)."""
from __future__ import annotations

import logging

from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger("grid-intel-scheduler")
_scheduler: BackgroundScheduler | None = None


def start_scheduler(cycle_fn, minutes: int = 15):
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(cycle_fn, "interval", minutes=minutes, id="grid-intel-cycle")
    _scheduler.start()
    logger.info("Grid-intel scheduler started (every %s min).", minutes)
    return _scheduler
