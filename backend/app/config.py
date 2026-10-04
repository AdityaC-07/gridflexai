"""GridFlex application configuration.

APP_MODE controls which storage backend is used:

  local  — In-memory store; no AWS credentials required.
           All service logic runs in-process in the single FastAPI/Uvicorn process.
           DynamoDB is never contacted unless AWS_ENDPOINT_URL points to LocalStack.

  aws    — DynamoDB is used as the primary store.
           AWS credentials (env, IAM role, or profile) must be configured.
           SNS alerts are published when SNS_ENABLED=true and SNS_TOPIC_ARN is set.

Any environment variable set in .env (or the shell) overrides the defaults.
The existing ``shared.config.Settings`` dataclass is intentionally kept intact
for backward-compatibility with the per-service containers.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field


def _float(name: str, default: float) -> float:
    try:
        return float(os.getenv(name, str(default)))
    except ValueError:
        return default


def _int(name: str, default: int) -> int:
    try:
        return int(os.getenv(name, str(default)))
    except ValueError:
        return default


@dataclass
class AppConfig:
    # ── Runtime mode ──────────────────────────────────────────────────────────
    # "local"  → in-memory store, no AWS credentials required
    # "aws"    → DynamoDB as primary store (existing production behaviour)
    app_mode: str = field(default_factory=lambda: os.getenv("APP_MODE", "local").lower())

    # ── AWS / DynamoDB ────────────────────────────────────────────────────────
    aws_region: str = field(default_factory=lambda: os.getenv("AWS_REGION", "ap-south-1"))
    aws_endpoint_url: str | None = field(default_factory=lambda: os.getenv("AWS_ENDPOINT_URL") or None)
    table_prefix: str = field(default_factory=lambda: os.getenv("DYNAMODB_TABLE_PREFIX", "gridflex"))

    # ── Grid parameters ───────────────────────────────────────────────────────
    feeder_id: str = field(default_factory=lambda: os.getenv("FEEDER_ID", "F01"))
    grid_import_limit_kw: float = field(default_factory=lambda: _float("GRID_IMPORT_LIMIT", 80.0))
    battery_capacity_kwh: float = field(default_factory=lambda: _float("BATTERY_CAPACITY_KWH", 200.0))
    battery_reserve_pct: float = field(default_factory=lambda: _float("BATTERY_RESERVE_PCT", 20.0))
    battery_max_discharge_kw: float = field(default_factory=lambda: _float("BATTERY_MAX_DISCHARGE_KW", 75.0))
    battery_max_charge_kw: float = field(default_factory=lambda: _float("BATTERY_MAX_CHARGE_KW", 50.0))
    critical_load_kw: float = field(default_factory=lambda: _float("CRITICAL_LOAD_KW", 48.0))
    peak_solar_kw: float = field(default_factory=lambda: _float("PEAK_SOLAR_KW", 150.0))

    # ── Location (Mumbai) ─────────────────────────────────────────────────────
    latitude: float = 19.0760
    longitude: float = 72.8777

    # ── Forecast / Optimisation horizons ──────────────────────────────────────
    forecast_horizon_slots: int = 48
    optimization_horizon_slots: int = 8
    gap_threshold_kw: float = 0.5

    # ── SNS alerts ────────────────────────────────────────────────────────────
    sns_topic_arn: str = field(default_factory=lambda: os.getenv("SNS_TOPIC_ARN", ""))
    sns_enabled: bool = field(
        default_factory=lambda: os.getenv("SNS_ENABLED", "false").lower() == "true"
    )

    # ── Groq (Copilot AI layer) ──────────────────────────────────────────────
    # GROQ_ENABLED=false  → Copilot returns deterministic fallback; no Groq call.
    # GROQ_ENABLED=true   → Full agentic tool-use loop with real LLM inference.
    #                        Also requires GROQ_API_KEY (https://console.groq.com).
    #
    # Default model: openai/gpt-oss-120b
    #   • Groq production/featured model, OpenAI-compatible Chat Completions API
    #   • Supports local tool use (function calling) + JSON mode
    #   • ~500 tokens/sec, 131k context window — best fit for the multi-tool
    #     GridFlex Copilot loop
    #   • Note: llama-3.3-70b-versatile was decommissioned by Groq on 2026-08-16
    #   • Alternatives: qwen/qwen3.8-27b (parallel tool use),
    #     openai/gpt-oss-20b (cheaper/faster, lower capability)
    groq_api_key: str = field(
        default_factory=lambda: os.getenv("GROQ_API_KEY", "")
    )
    groq_enabled: bool = field(
        default_factory=lambda: os.getenv("GROQ_ENABLED", "true").lower() == "true"
    )
    groq_model: str = field(
        default_factory=lambda: os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
    )
    groq_max_tokens: int = field(
        default_factory=lambda: _int("GROQ_MAX_TOKENS", 1024)
    )
    groq_temperature: float = field(
        # Groq recommends 0.5-0.7 for reasoning models (gpt-oss) to avoid
        # repetitive/incoherent outputs; 0.5 keeps answers grounded.
        default_factory=lambda: _float("GROQ_TEMPERATURE", 0.5)
    )

    # ── CORS ──────────────────────────────────────────────────────────────────
    # Comma-separated EXTRA origins allowed beyond the built-in list
    # (localhost dev + CloudFront). Set to your Vercel frontend URL in prod:
    #   CORS_ORIGINS=https://your-app.vercel.app
    cors_origins: str = field(default_factory=lambda: os.getenv("CORS_ORIGINS", ""))

    @property
    def is_local(self) -> bool:
        return self.app_mode == "local"

    @property
    def is_aws(self) -> bool:
        return self.app_mode == "aws"


# Singleton used throughout the unified app
config = AppConfig()
