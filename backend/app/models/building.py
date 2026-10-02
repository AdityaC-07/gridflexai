from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def generate_uuid():
    return uuid.uuid4()


class Building(Base):
    """Building model representing a facility/feeders."""

    __tablename__ = "buildings"

    id: Mapped[uuid.UUID] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    area_sqm: Mapped[float] = mapped_column(Float, nullable=False)
    climate_zone: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # tropical_wet, warm_humid, composite, temperate, cold
    occupancy_pax: Mapped[int] = mapped_column(Integer, nullable=False)
    tariff_peak_window: Mapped[str] = mapped_column(String(100), nullable=False)
    ecbc_compliant: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )

    # Relationships
    equipment: Mapped[List["Equipment"]] = relationship(
        "Equipment", back_populates="building", cascade="all, delete-orphan"
    )
    consumption: Mapped[List["EnergyConsumption"]] = relationship(
        "EnergyConsumption", back_populates="building", cascade="all, delete-orphan"
    )
    retrofits: Mapped[List["Retrofit"]] = relationship(
        "Retrofit", back_populates="building", cascade="all, delete-orphan"
    )
    flexibility_assets: Mapped[List["FlexibilityAsset"]] = relationship(
        "FlexibilityAsset", back_populates="building", cascade="all, delete-orphan"
    )
    dr_participation: Mapped[Optional["DRParticipation"]] = relationship(
        "DRParticipation", back_populates="building", uselist=False, cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_buildings_name", "name"),
        Index("ix_buildings_climate_zone", "climate_zone"),
    )

    def __repr__(self) -> str:
        return f"<Building(id={self.id}, name={self.name})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "area_sqm": self.area_sqm,
            "climate_zone": self.climate_zone,
            "occupancy_pax": self.occupancy_pax,
            "tariff_peak_window": self.tariff_peak_window,
            "ecbc_compliant": self.ecbc_compliant,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Equipment(Base):
    """Equipment model."""

    __tablename__ = "equipment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id: Mapped[str] = mapped_column(String(36), ForeignKey("buildings.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)  # HVAC, Lighting, Electrical
    health_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    age_years: Mapped[int] = mapped_column(Integer, nullable=False)
    last_maintenance: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    building = relationship("Building", back_populates="equipment")

    __table_args__ = (Index("ix_equipment_building_id", "building_id"),)

    def __repr__(self) -> str:
        return f"<Equipment(id={self.id}, type={self.type}, health={self.health_score})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "building_id": str(self.building_id),
            "type": self.type,
            "health_score": self.health_score,
            "age_years": self.age_years,
            "last_maintenance": self.last_maintenance.isoformat() if self.last_maintenance else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class EnergyConsumption(Base):
    """Energy consumption readings."""

    __tablename__ = "energy_consumption"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id: Mapped[str] = mapped_column(String(36), ForeignKey("buildings.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    kwh_total: Mapped[float] = mapped_column(Float, nullable=False)
    kwh_hvac: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    kwh_lighting: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    kwh_plug: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    baseline_kwh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    anomaly_flag: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    building = relationship("Building", back_populates="consumption")

    __table_args__ = (
        Index("ix_consumption_building_id", "building_id"),
        Index("ix_consumption_timestamp", "timestamp"),
        Index("ix_consumption_anomaly_flag", "anomaly_flag"),
        Index("ix_consumption_building_timestamp", "building_id", "timestamp"),
    )

    def __repr__(self) -> str:
        return f"<EnergyConsumption(building={self.building_id}, kwh={self.kwh_total})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "building_id": str(self.building_id),
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "kwh_total": self.kwh_total,
            "kwh_hvac": self.kwh_hvac,
            "kwh_lighting": self.kwh_lighting,
            "kwh_plug": self.kwh_plug,
            "baseline_kwh": self.baseline_kwh,
            "anomaly_flag": self.anomaly_flag,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
