"""Pydantic models for request/response validation."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class Telemetry(BaseModel):
    feeder_id: str = Field(min_length=1)
    timestamp: str
    demand_kw: float = Field(ge=0, le=10000)
    solar_kw: float = Field(ge=0, le=10000)
    battery_soc_pct: float = Field(ge=0, le=100)
    battery_soc_kwh: float = Field(ge=0)
    temperature_c: float = Field(ge=-20, le=60)
    grid_import_kw: float = Field(ge=0, le=10000)


class ForecastSlot(BaseModel):
    offset_minutes: int = Field(ge=0)
    forecast_kw: float = Field(ge=0)
    confidence_low_kw: float = Field(ge=0)
    confidence_high_kw: float = Field(ge=0)


class ForecastDoc(BaseModel):
    feeder_id: str
    created_at: str
    demand: list[ForecastSlot]
    solar: list[ForecastSlot]
    confidence: float = Field(ge=0, le=1)


class FlexLoad(BaseModel):
    load_type: str
    available_kw: float
    enrolled_households: int
    max_shift_hours: float


class FeederState(BaseModel):
    feeder_id: str
    timestamp: str
    demand_kw: float
    solar_kw: float
    grid_import_limit_kw: float
    battery_soc_pct: float
    gross_gap_kw: float
    battery_coverage_kw: float
    net_gap_kw: float
    has_gap: bool
    peak_gap_next_4h_kw: float
    stress_index: float
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    total_flexible_kw: float
    load_breakdown: list[FlexLoad]
    recommended_action: str
    status: str = "OK"


class OptimizationResult(BaseModel):
    method: str
    battery_dispatch_kw: list[float]
    load_shift_kw: list[float]
    unserved_kw: list[float]
    total_unserved_kwh: float
    expected_reliability_pct: float
    battery_energy_used_kwh: float


class PolicyCheck(BaseModel):
    rule: str
    passed: bool
    message: str


class PolicyResult(BaseModel):
    approved: bool
    requires_manual_approval: bool
    auto_execute: bool
    policy_checks: list[PolicyCheck]
    all_checks_passed: bool
    optimization_result: dict[str, Any]


class Decision(BaseModel):
    decision_id: str
    feeder_id: str
    created_at: str
    optimization: OptimizationResult
    policy: PolicyResult
    explanation: str
    status: Literal["PENDING_APPROVAL", "APPROVED", "BLOCKED"] = "PENDING_APPROVAL"


class DispatchPlanResource(BaseModel):
    resource_id: str
    resource_type: str
    resource_name: str
    dispatch_kw: float
    duration_minutes: int
    priority: int
    owner_type: str
    reliability_budget_score: float | None = None


class DispatchPlan(BaseModel):
    resources: list[DispatchPlanResource]
    total_dispatch_kw: float
    battery_reserve_after_pct: float
    expected_unserved_energy_kwh: float
    critical_load_protected_kw: float


class ReliabilityEvent(BaseModel):
    event_id: str
    feeder_id: str
    status: Literal["PREDICTED", "ACTIVE", "OPERATOR_APPROVED", "DISPATCHED", "VERIFYING", "VERIFIED", "CLOSED", "OPERATOR_REJECTED", "MANUAL_HANDLING"]
    predicted_gap_kw: float
    duration_minutes: int
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    critical_load_kw: float
    flexibility_available_kw: float
    dispatch_plan: DispatchPlan | None = None
    battery_reserve_after_pct: float | None = None
    forecast_confidence: float
    created_at: str
    approved_at: str | None = None
    verified_at: str | None = None
    outcome: dict[str, Any] | None = None


class FlexibilityResource(BaseModel):
    resource_id: str
    feeder_id: str
    resource_type: Literal["battery", "ev_charging", "hvac", "water_pump", "water_heater", "commercial_load", "rooftop_solar"]
    resource_name: str
    available_kw: float
    max_duration_minutes: int
    response_time_minutes: int
    min_operation_pct: float
    max_operation_pct: float
    criticality: Literal["infrastructure", "deferrable", "comfort", "semi_critical", "critical"]
    comfort_impact: Literal["none", "low", "medium", "high"]
    owner_type: Literal["community", "resident", "commercial", "municipal"]
    location_section: str | None = None
    enrolled: bool = True
    availability: float = 1.0
    response_reliability: float = 0.95
    disruption_weight: float
    reliability_budget_score: float | None = None
