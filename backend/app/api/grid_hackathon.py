from __future__ import annotations

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.grid_service import GridOperatorService

router = APIRouter(prefix="/grid", tags=["grid-hackathon"])


@router.get("/state")
def get_grid_state(db: Session = Depends(get_db)):
    service = GridOperatorService(db)
    return service.get_current_grid_state()


@router.get("/generation-mix")
def get_generation_mix(db: Session = Depends(get_db)):
    service = GridOperatorService(db)
    return service.get_regional_generation_mix()


@router.get("/peak-alert")
def get_peak_alert(db: Session = Depends(get_db)):
    service = GridOperatorService(db)
    return {
        "peak_active": True,
        "window": "14:00 - 18:00 IST",
        "remaining_minutes": 102,
        "tariff": 15.50,
    }


@router.get("/energy-forecast")
def get_energy_forecast(building_id: Optional[UUID] = None, db: Session = Depends(get_db)):
    service = GridOperatorService(db)
    return service.get_24h_energy_forecast(building_id)
