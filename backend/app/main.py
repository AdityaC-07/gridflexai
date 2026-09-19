"""GridFlex Unified Backend — single-process entrypoint.

Start locally with ONE command from the backend/ directory:

    uvicorn app.main:app --reload

This FastAPI application replaces the five-terminal / Docker-compose setup
for local development.  The production AWS ECS/Fargate deployment is NOT
affected — each per-service Dockerfile continues to work unchanged.

APP_MODE
────────
  local (default) — in-memory store, no AWS credentials required.
  aws             — DynamoDB as primary store (existing production behaviour).

Architecture
────────────
  app/main.py          ← You are here (FastAPI app + router mounts)
  app/config.py        ← APP_MODE + all configuration
  app/core/store.py    ← Storage abstraction (local dict ↔ DynamoDB)
  app/api/             ← FastAPI routers (one per domain)
  app/services/        ← Pure Python service logic (calls existing modules)
  app/agents/          ← Copilot agent + read-only tool interface
  forecast_service/    ← Unchanged — reused by ForecastService
  grid_intelligence/   ← Unchanged — reused by GridIntelligenceService
  optimization_service/← Unchanged — reused by OptimizationService
  verification_service/← Unchanged — reused by ReliabilityService
  shared/              ← Unchanged — used in aws mode

All existing API contracts are preserved.
"""
from __future__ import annotations

import logging
import os
import sys

# ── Ensure backend/ is on the Python path ────────────────────────────────────
# This allows the existing per-service packages (forecast_service, etc.)
# to be imported without modification.
_backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _backend_root not in sys.path:
    sys.path.insert(0, _backend_root)

from dotenv import load_dotenv

load_dotenv(os.path.join(_backend_root, ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import config

# ── Local DynamoDB patch (must be applied before any service imports) ─────────
# In local mode, monkey-patch shared.dynamo to use the in-memory store.
# This eliminates all "no AWS credentials" warnings and makes all service
# modules share the same in-memory state without any code changes to them.
if config.is_local:
    from app.core.local_dynamo_patch import apply_patch as _apply_dynamo_patch
    _apply_dynamo_patch()

# ── Routers ───────────────────────────────────────────────────────────────────
from app.api import (
    telemetry,
    forecast,
    grid,
    optimization,
    reliability,
    events,
    flexibility,
    copilot,
    simulation,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("app.main")

# ── FastAPI application ───────────────────────────────────────────────────────
app = FastAPI(
    title="GridFlex Unified Backend",
    description=(
        "ONE process. ONE terminal. All GridFlex capabilities. "
        f"Mode: {config.app_mode.upper()}"
    ),
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount all routers under /api/v1 ──────────────────────────────────────────
PREFIX = "/api/v1"

app.include_router(telemetry.router, prefix=PREFIX)
app.include_router(forecast.router, prefix=PREFIX)
app.include_router(grid.router, prefix=PREFIX)
app.include_router(optimization.router, prefix=PREFIX)
app.include_router(reliability.router, prefix=PREFIX)
app.include_router(events.router, prefix=PREFIX)
app.include_router(flexibility.router, prefix=PREFIX)
app.include_router(copilot.router, prefix=PREFIX)

# Simulation endpoints use legacy unversioned paths (/simulation/*)
# to preserve the existing frontend contract.
app.include_router(simulation.router)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health() -> dict:
    """Unified health check — does NOT contact AWS in local mode."""
    from app.core.store import store_available

    service_status: dict[str, str] = {}

    # Forecast: check model readiness
    try:
        from app.services.forecast import forecast_service
        service_status["forecast"] = "ready" if forecast_service.model_ready else "degraded (fallback model)"
    except Exception as exc:
        service_status["forecast"] = f"error: {exc}"

    # Grid intelligence: always available (pure Python)
    service_status["grid_intelligence"] = "ready"

    # Optimization: always available (pure Python, scipy)
    service_status["optimization"] = "ready"

    # Reliability: always available
    service_status["reliability"] = "ready"

    # Event detection: always available
    service_status["event_detection"] = "ready"

    # Flexibility pool: always available
    service_status["flexibility"] = "ready"

    # Copilot: always available (rule-based MVP)
    service_status["copilot"] = "ready (rule-based)"

    # Store
    if config.is_aws:
        service_status["store"] = "dynamodb-connected" if store_available() else "dynamodb-unavailable"
    else:
        service_status["store"] = "in-memory (local)"

    return {
        "status": "ok",
        "mode": config.app_mode,
        "feeder_id": config.feeder_id,
        "services": service_status,
    }


# ── Startup event ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup() -> None:
    logger.info("=" * 60)
    logger.info("GridFlex Unified Backend starting")
    logger.info("  APP_MODE  = %s", config.app_mode)
    logger.info("  FEEDER_ID = %s", config.feeder_id)
    logger.info("  AWS_REGION= %s", config.aws_region)
    if config.is_local:
        logger.info("  Store     = in-memory (no AWS credentials required)")
    else:
        logger.info("  Store     = DynamoDB (%s)", config.aws_region)
    logger.info("=" * 60)

    # Warm the demand forecaster model
    try:
        from app.services.forecast import forecast_service
        forecast_service.startup()
        logger.info("Forecast model ready: %s", forecast_service.model_ready)
    except Exception as exc:
        logger.warning("Forecast model warm-up failed (%s); fallback active.", exc)

    logger.info("All services initialised. API ready at /docs")


# ── Allow running directly with `python -m app.main` ─────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
