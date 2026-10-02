from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.simulation import Simulation, SimulationResult
from app.services.groq_service import groq_service

logger = logging.getLogger(__name__)


class SimulationService:
    """Simulation and what-if engine."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def inject_scenario(
        self,
        feeder_id: str,
        scenario_type: str,
        severity_degradation_percent: float,
        duration_minutes: int,
    ) -> UUID:
        """Inject a simulation scenario."""
        simulation = Simulation(
            feeder_id=feeder_id,
            scenario_type=scenario_type,
            severity_degradation_percent=severity_degradation_percent,
            duration_minutes=duration_minutes,
        )
        self.db.add(simulation)
        self.db.commit()
        self.db.refresh(simulation)
        return simulation.id

    def run_simulation(self, simulation_id: UUID) -> Dict:
        """Run simulation."""
        simulation = self.db.query(Simulation).filter(Simulation.id == simulation_id).first()
        if not simulation:
            raise ValueError(f"Simulation {simulation_id} not found")

        # Simple mock simulation results
        baseline_unserved = 280.0
        gridflex_unserved = 0.0
        if simulation.severity_degradation_percent > 0:
            baseline_unserved = 280.0 * (1 + simulation.severity_degradation_percent / 100)
            gridflex_unserved = baseline_unserved * 0.1  # 90% reduction

        reliability_improvement = ((baseline_unserved - gridflex_unserved) / baseline_unserved * 100) if baseline_unserved > 0 else 100

        result = SimulationResult(
            simulation_id=simulation_id,
            unserved_energy_kwh=round(gridflex_unserved, 2),
            critical_interruptions=0 if gridflex_unserved < 50 else 2,
            reliability_improvement_percent=round(reliability_improvement, 2),
            dispatch_plan={"actions": []},
            hourly_traces={},
        )
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        return result.to_dict()

    def get_simulation_results(self, simulation_id: UUID) -> Dict:
        """Get simulation results."""
        simulation = self.db.query(Simulation).filter(Simulation.id == simulation_id).first()
        if not simulation:
            return {}

        result = self.db.query(SimulationResult).filter(SimulationResult.simulation_id == simulation_id).first()
        if not result:
            return simulation.to_dict()

        return {
            "scenario": simulation.to_dict(),
            "baseline_performance": {
                "unserved_energy_kwh": 280.0 * (1 + simulation.severity_degradation_percent / 100),
                "critical_interruptions": 8,
            },
            "gridflex_performance": {
                "unserved_energy_kwh": result.unserved_energy_kwh,
                "critical_interruptions": result.critical_interruptions,
            },
            "reliability_improvement_percent": result.reliability_improvement_percent,
            "dispatch_plan": result.dispatch_plan,
            "hourly_traces": result.hourly_traces,
        }
