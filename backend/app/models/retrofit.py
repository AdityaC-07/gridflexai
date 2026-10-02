from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Retrofit(Base):
    """Retrofit recommendation model."""

    __tablename__ = "retrofits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id: Mapped[str] = mapped_column(String(36), ForeignKey("buildings.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    annual_savings_kwh: Mapped[float] = mapped_column(Float, nullable=False)
    annual_savings_rupees: Mapped[float] = mapped_column(Float, nullable=False)
    capex_rupees: Mapped[float] = mapped_column(Float, nullable=False)
    payback_years: Mapped[float] = mapped_column(Float, nullable=False)
    applicability_score: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    groq_confidence: Mapped[float] = mapped_column(Float, nullable=False)  # 0-100
    selected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    building = relationship("Building", back_populates="retrofits")

    __table_args__ = (Index("ix_retrofits_building_id", "building_id"),)

    def __repr__(self) -> str:
        return f"<Retrofit(id={self.id}, name={self.name})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "building_id": str(self.building_id),
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "annual_savings_kwh": self.annual_savings_kwh,
            "annual_savings_rupees": self.annual_savings_rupees,
            "capex_rupees": self.capex_rupees,
            "payback_years": self.payback_years,
            "applicability_score": self.applicability_score,
            "groq_confidence": self.groq_confidence,
            "selected": self.selected,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DRParticipation(Base):
    """Demand response participation model."""

    __tablename__ = "dr_participation"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    building_id: Mapped[str] = mapped_column(String(36), ForeignKey("buildings.id"), nullable=False, unique=True)
    enrolled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    autonomous_dispatch: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    kwh_shifted_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    earnings_rupees_total: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    last_dispatch: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    building = relationship("Building", back_populates="dr_participation")

    __table_args__ = (Index("ix_dr_participation_building_id", "building_id"),)

    def __repr__(self) -> str:
        return f"<DRParticipation(building={self.building_id}, enrolled={self.enrolled})>"

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "building_id": str(self.building_id),
            "enrolled": self.enrolled,
            "autonomous_dispatch": self.autonomous_dispatch,
            "kwh_shifted_total": self.kwh_shifted_total,
            "earnings_rupees_total": self.earnings_rupees_total,
            "last_dispatch": self.last_dispatch.isoformat() if self.last_dispatch else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
