from __future__ import annotations

import logging
from datetime import datetime
from typing import Dict, List
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.grid import GridState, FlexibilityAsset
from app.services.groq_service import groq_service
from app.utils.prompt_templates import DR_OPTIMIZATION_PROMPT

logger = logging.getLogger(__name__)


class GridOperatorService:
    """Grid operator service for real-time DR dispatch."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_current_grid_state(self) -> Dict:
        """Get current grid state (mock for demo)."""
        state = GridState(
            timestamp=datetime.utcnow(),
            frequency_hz=50.02,
            load_percent=92.0,
            tariff_rupees_per_kwh=15.50,
            peak_active=True,
        )
        self.db.add(state)
        self.db.commit()
        return state.to_dict()

    def is_peak_demand_active(self) -> bool:
        """Check if peak demand is active."""
        return True  # Mock for demo

    def check_demand_response_trigger(self) -> bool:
        """Check if DR should be triggered."""
        return self.is_peak_demand_active()

    def get_flexibility_assets_for_building(self, building_id: UUID) -> List[Dict]:
        """Get flexibility assets for building."""
        assets = self.db.query(FlexibilityAsset).filter(FlexibilityAsset.building_id == building_id).all()
        return [a.to_dict() for a in assets]

    def optimize_dr_dispatch(self, building_id: UUID, grid_state: Dict) -> Dict:
        """Optimize DR dispatch using Groq."""
        assets = self.get_flexibility_assets_for_building(building_id)

        prompt = DR_OPTIMIZATION_PROMPT.format(
            grid_state=str(grid_state),
            flexibility_assets=str(assets),
            battery_state=str({}),
            building_context=str({}),
        )

        result = groq_service.generate_structured_response(prompt)
        if result:
            return result

        return {
            "dispatch_plan": [
                {
                    "asset_type": "hvac",
                    "action": "reduce",
                    "magnitude_kw": 50,
                    "duration_minutes": 120,
                    "priority": 1,
                    "comfort_impact": "low",
                }
            ],
            "summary": {
                "total_kwh_shifted": 100,
                "projected_revenue_rupees": 1500,
                "comfort_impact_score": 10,
                "grid_benefit_kw": 100,
            },
        }

    def get_24h_energy_forecast(self, building_id: UUID = None) -> Dict:
        """Get 24-hour energy forecast (mock)."""
        forecast = []
        for hour in range(24):
            demand_kw = 120 + 40 * (1 + hour % 12) / 12 if hour >= 8 and hour <= 20 else 80
            solar_kw = max(0, 150 * math_solar_factor(hour)) if hour >= 6 and hour <= 18 else 0
            forecast.append(
                {
                    "hour": hour,
                    "demand_kw": round(demand_kw, 2),
                    "solar_kw": round(solar_kw, 2),
                }
            )
        return {"forecast": forecast, "confidence": 0.75}

    def get_regional_generation_mix(self) -> Dict:
        """Get regional generation mix (mock)."""
        return {
            "solar": {"mw": 8500, "percent": 35, "trend": "down", "next_event": "sunset at 18:15 IST"},
            "wind": {"mw": 3200, "percent": 13, "trend": "up"},
            "conventional": {"mw": 15600, "percent": 52, "trend": "stable"},
        }


def math_solar_factor(hour: int) -> float:
    """Simple solar factor."""
    import math

    if hour < 6 or hour > 18:
        return 0
    noon = 12
    return math.sin(math.pi * (hour - 6) / 12)
