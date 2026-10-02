from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.simulation_service import SimulationService

router = APIRouter(prefix="/simulation", tags=["simulation-hackathon"])


class InjectScenario(BaseModel):
    feeder_id: str
    scenario_type: str
    severity_degradation_percent: float
    duration_minutes: int


@router.post("/inject-event")
def inject_event(data: InjectScenario, db: Session = Depends(get_db)):
    service = SimulationService(db)
    try:
        sim_id = service.inject_scenario(
            data.feeder_id,
            data.scenario_type,
            data.severity_degradation_percent,
            data.duration_minutes,
        )
        return {"simulation_id": str(sim_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{simulation_id}/results")
def get_results(simulation_id: UUID, db: Session = Depends(get_db)):
    service = SimulationService(db)
    try:
        return service.get_simulation_results(simulation_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
def reset_simulation(db: Session = Depends(get_db)):
    return {"status": "reset"}
