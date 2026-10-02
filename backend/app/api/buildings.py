from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.building_service import BuildingService, BuildingNotFound

router = APIRouter(tags=["buildings"])


class BuildingCreate(BaseModel):
    name: str
    area_sqm: float
    climate_zone: str
    occupancy_pax: int
    tariff_peak_window: str
    ecbc_compliant: bool = False


class BuildingUpdate(BaseModel):
    name: Optional[str] = None
    area_sqm: Optional[float] = None
    climate_zone: Optional[str] = None
    occupancy_pax: Optional[int] = None
    tariff_peak_window: Optional[str] = None
    ecbc_compliant: Optional[bool] = None


class ConsumptionIngest(BaseModel):
    timestamp: str
    kwh_total: float
    kwh_hvac: float = 0.0
    kwh_lighting: float = 0.0
    kwh_plug: float = 0.0


@router.get("/buildings")
def list_buildings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    service = BuildingService(db)
    buildings = service.list_buildings(skip=skip, limit=limit)
    return [b.to_dict() for b in buildings]


@router.post("/buildings")
def create_building(data: BuildingCreate, db: Session = Depends(get_db)):
    service = BuildingService(db)
    try:
        b = service.create_building(data.model_dump())
        return b.to_dict()
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/buildings/{building_id}")
def get_building(building_id: UUID, db: Session = Depends(get_db)):
    service = BuildingService(db)
    b = service.get_building(building_id)
    if not b:
        raise HTTPException(status_code=404, detail="Building not found")
    return service.get_building_profile(building_id)


@router.get("/buildings/{building_id}/consumption/timeseries")
def get_timeseries(building_id: UUID, days: int = 7, db: Session = Depends(get_db)):
    service = BuildingService(db)
    consumption = service.get_consumption_timeseries(building_id, days=days)
    return [c.to_dict() for c in consumption]


@router.get("/buildings/{building_id}/consumption/vs-baseline")
def get_efficiency_vs_baseline(building_id: UUID, db: Session = Depends(get_db)):
    service = BuildingService(db)
    try:
        return service.get_efficiency_vs_baseline(building_id)
    except BuildingNotFound:
        raise HTTPException(status_code=404, detail="Building not found")


@router.post("/buildings/{building_id}/consumption")
def ingest_consumption(building_id: UUID, data: ConsumptionIngest, db: Session = Depends(get_db)):
    from datetime import datetime

    service = BuildingService(db)
    try:
        ts = datetime.fromisoformat(data.timestamp.replace("Z", "+00:00")) if "T" in data.timestamp else datetime.fromisoformat(data.timestamp)
    except Exception:
        ts = datetime.utcnow()
    try:
        c = service.ingest_consumption(
            building_id,
            ts,
            data.kwh_total,
            data.kwh_hvac,
            data.kwh_lighting,
            data.kwh_plug,
        )
        return c.to_dict()
    except BuildingNotFound:
        raise HTTPException(status_code=404, detail="Building not found")
