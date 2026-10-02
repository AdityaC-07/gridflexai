from __future__ import annotations

import json
import logging
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.retrofit import Retrofit
from app.services.groq_service import groq_service
from app.services.building_service import BuildingService
from app.utils.prompt_templates import RETROFIT_RECOMMENDATION_PROMPT

logger = logging.getLogger(__name__)


class RetrofitNotFound(Exception):
    pass


class RetrofitService:
    """Retrofit service with Groq LLM integration."""

    def __init__(self, db: Session) -> None:
        self.db = db
        self.building_service = BuildingService(db)

    def get_retrofits_for_building(self, building_id: UUID, limit: int = 5) -> List[Retrofit]:
        """Get retrofits for building (cached from DB)."""
        return (
            self.db.query(Retrofit)
            .filter(Retrofit.building_id == building_id)
            .order_by(Retrofit.created_at.desc())
            .limit(limit)
            .all()
        )

    def generate_retrofit_recommendations(self, building_id: UUID, force_regenerate: bool = False) -> Dict:
        """Generate retrofit recommendations using Groq LLM."""
        # Check cache if not forcing regenerate
        if not force_regenerate:
            existing = self.get_retrofits_for_building(building_id, limit=10)
            if existing:
                logger.info("Returning cached retrofits for building %s", building_id)
                return self._build_portfolio_summary(building_id, existing)

        # Fetch data
        building_profile = self.building_service.get_building_profile(building_id)
        consumption = self.building_service.get_consumption_timeseries(building_id, days=30)
        energy_data = [c.to_dict() for c in consumption]

        # Prepare prompt
        prompt = RETROFIT_RECOMMENDATION_PROMPT.format(
            building_profile=json.dumps(building_profile, indent=2),
            energy_data=json.dumps(energy_data, indent=2),
            equipment_data=json.dumps(building_profile.get("equipment", []), indent=2),
        )

        # Call Groq
        llm_response = groq_service.generate_structured_response(prompt)
        if not llm_response or isinstance(llm_response, dict) and "retrofits" not in str(llm_response):
            # Try to parse as array if returned directly
            if isinstance(llm_response, list):
                retrofit_data_list = llm_response
            else:
                logger.warning("Failed to get valid LLM response, using fallback")
                retrofit_data_list = self._get_fallback_recommendations()
        else:
            # Response might be dict with retrofits key
            retrofit_data_list = (
                llm_response.get("retrofits") if isinstance(llm_response, dict) else llm_response
            )

        # Save retrofits to DB
        saved_retrofits = []
        for item in retrofit_data_list:
            retrofit = Retrofit(
                building_id=building_id,
                name=item["name"],
                category=item["category"],
                description=item.get("description"),
                annual_savings_kwh=float(item["annual_savings_kwh"]),
                annual_savings_rupees=float(item.get("annual_savings_rupees", item["annual_savings_kwh"] * 12)),
                capex_rupees=float(item["capex_rupees"]),
                payback_years=float(item.get("payback_years", float(item["capex_rupees"]) / max(float(item.get("annual_savings_rupees", 1)), 1))),
                applicability_score=float(item["applicability_score"]),
                groq_confidence=float(item["groq_confidence"]),
                selected=False,
            )
            self.db.add(retrofit)
            saved_retrofits.append(retrofit)

        self.db.commit()
        for r in saved_retrofits:
            self.db.refresh(r)

        return self._build_portfolio_summary(building_id, saved_retrofits)

    def _build_portfolio_summary(self, building_id: UUID, retrofits: List[Retrofit]) -> Dict:
        """Build portfolio summary."""
        if not retrofits:
            return {
                "building_id": str(building_id),
                "retrofits": [],
                "portfolio_summary": {
                    "total_capex": 0,
                    "annual_savings": 0,
                    "blended_payback": 0,
                    "confidence": 0,
                },
            }

        total_capex = sum(r.capex_rupees for r in retrofits)
        annual_savings = sum(r.annual_savings_rupees for r in retrofits)
        blended_payback = total_capex / annual_savings if annual_savings > 0 else 0
        avg_confidence = sum(r.groq_confidence for r in retrofits) / len(retrofits)

        return {
            "building_id": str(building_id),
            "retrofits": [r.to_dict() for r in retrofits],
            "portfolio_summary": {
                "total_capex": round(total_capex, 2),
                "annual_savings": round(annual_savings, 2),
                "blended_payback": round(blended_payback, 2),
                "confidence": round(avg_confidence, 2),
            },
        }

    def _get_fallback_recommendations(self) -> List[Dict]:
        """Fallback recommendations if Groq is unavailable."""
        return [
            {
                "name": "HVAC Scheduling Optimization",
                "category": "HVAC",
                "description": "Optimize HVAC schedules to reduce runtime during peak hours.",
                "annual_savings_kwh": 15000,
                "annual_savings_rupees": 180000,
                "capex_rupees": 100000,
                "payback_years": 0.56,
                "applicability_score": 90,
                "groq_confidence": 75,
            },
            {
                "name": "LED Lighting Retrofit",
                "category": "Lighting",
                "description": "Replace conventional lighting with energy-efficient LEDs.",
                "annual_savings_kwh": 8000,
                "annual_savings_rupees": 96000,
                "capex_rupees": 150000,
                "payback_years": 1.56,
                "applicability_score": 85,
                "groq_confidence": 80,
            },
        ]

    def select_retrofits(self, building_id: UUID, selected_retrofit_ids: List[UUID]) -> Dict:
        """Select retrofits for implementation."""
        retrofits = self.db.query(Retrofit).filter(
            Retrofit.building_id == building_id,
            Retrofit.id.in_(selected_retrofit_ids),
        ).all()

        for r in retrofits:
            r.selected = True

        self.db.commit()

        total_capex = sum(r.capex_rupees for r in retrofits)
        annual_savings = sum(r.annual_savings_rupees for r in retrofits)
        blended_payback = total_capex / annual_savings if annual_savings > 0 else 0

        return {
            "selected_count": len(retrofits),
            "total_investment": round(total_capex, 2),
            "annual_savings": round(annual_savings, 2),
            "blended_payback_years": round(blended_payback, 2),
        }
