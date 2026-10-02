from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.equipment_diagnostics import EquipmentDiagnosticsService

router = APIRouter(prefix="/buildings/{building_id}/equipment", tags=["equipment"])


@router.get("/anomalies")
def get_anomalies(building_id: UUID, db: Session = Depends(get_db)):
    # Simple mock response for now
    return []


@router.get("/health")
def get_health(building_id: UUID, db: Session = Depends(get_db)):
    service = EquipmentDiagnosticsService(db)
    return service.get_equipment_health_summary(building_id)
