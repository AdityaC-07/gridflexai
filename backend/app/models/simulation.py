from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Column, DateTime, Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import JSON as SAJSON

from app.db.database import Base


class Simulation(Base):
    """Simulation scenario model."""

    __tablename__ = "simulations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    feeder_id: Mapped[str] = mapped_column(String(50), nullable=False)
    scenario_type: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # cloud_event, demand_surge, equipment_failure
    severity_degradation_percent: Mapped[float] = mapped_column(Float, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    results: Mapped[List["SimulationResult"]] = relationship(
        "SimulationResult", back_populates="simulation", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_simulations_feeder_id", "feeder_id"),
        Index("ix_simulations_scenario_type", "scenario_type"),
    )

    def __repr__(self) -> str:
        return f"<Simulation(feeder={self.feeder_id}, type={self.scenario_type})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "feeder_id": self.feeder_id,
            "scenario_type": self.scenario_type,
            "severity_degradation_percent": self.severity_degradation_percent,
            "duration_minutes": self.duration_minutes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class SimulationResult(Base):
    """Simulation result model."""

    __tablename__ = "simulation_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    simulation_id: Mapped[str] = mapped_column(String(36), ForeignKey("simulations.id"), nullable=False)
    unserved_energy_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    critical_interruptions: Mapped[int] = mapped_column(Integer, nullable=False)
    reliability_improvement_percent: Mapped[float] = mapped_column(Float, nullable=False)
    dispatch_plan: Mapped[Optional[dict]] = mapped_column(SAJSON, nullable=True)
    hourly_traces: Mapped[Optional[dict]] = mapped_column(SAJSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    simulation = relationship("Simulation", back_populates="results")

    __table_args__ = (Index("ix_simulation_results_simulation_id", "simulation_id"),)

    def __repr__(self) -> str:
        return f"<SimulationResult(simulation={self.simulation_id})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "simulation_id": str(self.simulation_id),
            "unserved_energy_kwh": self.unserved_energy_kwh,
            "critical_interruptions": self.critical_interruptions,
            "reliability_improvement_percent": self.reliability_improvement_percent,
            "dispatch_plan": self.dispatch_plan,
            "hourly_traces": self.hourly_traces,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
