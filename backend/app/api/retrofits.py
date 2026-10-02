from __future__ import annotations

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.retrofit_service import RetrofitService

router = APIRouter(tags=["retrofits"])


class SelectRetrofits(BaseModel):
    selected_ids: List[UUID]


@router.get("/buildings/{building_id}/retrofits")
def get_retrofits(building_id: UUID, db: Session = Depends(get_db)):
    service = RetrofitService(db)
    retrofits = service.get_retrofits_for_building(building_id)
    return [r.to_dict() for r in retrofits]


@router.post("/buildings/{building_id}/retrofit-recommendations")
def generate_recommendations(building_id: UUID, force_regenerate: bool = False, db: Session = Depends(get_db)):
    service = RetrofitService(db)
    try:
        return service.generate_retrofit_recommendations(building_id, force_regenerate)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/buildings/{building_id}/retrofits/select")
def select_retrofits(building_id: UUID, data: SelectRetrofits, db: Session = Depends(get_db)):
    service = RetrofitService(db)
    try:
        return service.select_retrofits(building_id, data.selected_ids)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
