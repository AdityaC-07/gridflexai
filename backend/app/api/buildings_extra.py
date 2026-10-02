from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.grid_service import GridOperatorService

router = APIRouter(tags=["buildings-extra"])


@router.get("/buildings/{building_id}/flexibility-assets")
def get_flexibility_assets(building_id: UUID, db: Session = Depends(get_db)):
    service = GridOperatorService(db)
    return service.get_flexibility_assets_for_building(building_id)
