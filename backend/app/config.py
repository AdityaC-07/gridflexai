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

    # ── Amazon Bedrock (Copilot AI layer) ─────────────────────────────────────
    # BEDROCK_ENABLED=false  → Copilot returns deterministic fallback; no Bedrock call.
    # BEDROCK_ENABLED=true   → Full Converse API agentic loop with real LLM inference.
    #
    # Default model: amazon.nova-lite-v1:0
    #   • Supports tool use via Converse API
    #   • Available in ap-south-1
    #   • Lowest latency / cost for interactive Q&A
    #   • Change to anthropic.claude-3-haiku-20240307-v1:0 or
    #     us.amazon.nova-pro-v1:0 (cross-region) for higher capability
    bedrock_enabled: bool = field(
        default_factory=lambda: os.getenv("BEDROCK_ENABLED", "false").lower() == "true"
    )
    bedrock_model_id: str = field(
        default_factory=lambda: os.getenv(
            "BEDROCK_MODEL_ID", "apac.amazon.nova-lite-v1:0"
        )
    )
    bedrock_max_tokens: int = field(
        default_factory=lambda: _int("BEDROCK_MAX_TOKENS", 1000)
    )
    bedrock_temperature: float = field(
        default_factory=lambda: _float("BEDROCK_TEMPERATURE", 0.2)
    )
    # Optional guardrail integration
    bedrock_guardrail_id: str = field(
        default_factory=lambda: os.getenv("BEDROCK_GUARDRAIL_ID", "")
    )
    bedrock_guardrail_version: str = field(
        default_factory=lambda: os.getenv("BEDROCK_GUARDRAIL_VERSION", "")
    )

    @property
    def is_local(self) -> bool:
        return self.app_mode == "local"

    @property
    def is_aws(self) -> bool:
        return self.app_mode == "aws"

    @property
    def bedrock_guardrail_configured(self) -> bool:
        return bool(self.bedrock_guardrail_id and self.bedrock_guardrail_version)


# Singleton used throughout the unified app
config = AppConfig()
