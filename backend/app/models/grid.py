from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class GridState(Base):
    """Grid state model storing latest grid conditions."""

    __tablename__ = "grid_state"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    frequency_hz: Mapped[float] = mapped_column(Float, nullable=False)
    load_percent: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    tariff_rupees_per_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    peak_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("ix_grid_state_timestamp", "timestamp"),
        Index("ix_grid_state_peak_active", "peak_active"),
    )

    def __repr__(self) -> str:
        return f"<GridState(freq={self.frequency_hz}, load={self.load_percent})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "frequency_hz": self.frequency_hz,
            "load_percent": self.load_percent,
            "tariff_rupees_per_kwh": self.tariff_rupees_per_kwh,
            "peak_active": self.peak_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class FlexibilityAsset(Base):
    """Flexibility asset model."""

    __tablename__ = "flexibility_assets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id: Mapped[str] = mapped_column(String(36), ForeignKey("buildings.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)  # hvac, water_heater, ev_charging, non_essential_ac
    capacity_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    latency_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ready", nullable=False)  # ready, active, paused
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    building = relationship("Building", back_populates="flexibility_assets")

    __table_args__ = (Index("ix_flexibility_assets_building_id", "building_id"),)

    def __repr__(self) -> str:
        return f"<FlexibilityAsset(type={self.type}, capacity={self.capacity_kwh})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "building_id": str(self.building_id),
            "type": self.type,
            "capacity_kwh": self.capacity_kwh,
            "latency_minutes": self.latency_minutes,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
