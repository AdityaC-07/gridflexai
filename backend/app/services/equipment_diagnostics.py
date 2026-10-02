from __future__ import annotations

import logging
import math
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.building import Equipment, EnergyConsumption
from app.services.groq_service import groq_service
from app.utils.prompt_templates import ANOMALY_DIAGNOSIS_PROMPT

logger = logging.getLogger(__name__)


class EquipmentDiagnosticsService:
    """Equipment diagnostics and anomaly detection service."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def detect_anomalies(
        self, building_id: UUID, equipment_id: UUID, latest_reading: float, baseline: float
    ) -> Optional[Dict]:
        """Detect anomalies using statistical methods."""
        variance_percent = 0
        if baseline > 0:
            variance_percent = ((latest_reading - baseline) / baseline) * 100

        # Get historical readings
        history = (
            self.db.query(EnergyConsumption)
            .filter(EnergyConsumption.building_id == building_id)
            .order_by(EnergyConsumption.timestamp.desc())
            .limit(30)
            .all()
        )

        z_score = 0
        if len(history) > 1:
            readings = [h.kwh_total for h in history]
            mean = sum(readings) / len(readings)
            variance = sum((r - mean) ** 2 for r in readings) / len(readings)
            std_dev = math.sqrt(variance)
            if std_dev > 0:
                z_score = (latest_reading - mean) / std_dev

        # Flag anomaly
        if variance_percent > 20 or abs(z_score) > 3:
            severity = self.get_anomaly_severity("", variance_percent, abs(z_score))
            return {
                "anomaly_detected": True,
                "variance_percent": round(variance_percent, 2),
                "z_score": round(z_score, 2),
                "severity": severity,
            }
        return None

    def get_anomaly_severity(self, equipment_type: str, variance_percent: float, z_score: float) -> str:
        """Determine anomaly severity."""
        if z_score > 5 or variance_percent > 50:
            return "CRITICAL"
        if z_score > 3 or variance_percent > 20:
            return "HIGH"
        if z_score > 2 or variance_percent > 10:
            return "MEDIUM"
        return "LOW"

    def diagnose_anomaly(self, building_id: UUID, equipment_id: UUID, anomaly_data: Dict) -> Dict:
        """Diagnose anomaly using Groq LLM."""
        equipment = self.db.query(Equipment).filter(Equipment.id == equipment_id).first()
        equipment_metadata = equipment.to_dict() if equipment else {}

        prompt = ANOMALY_DIAGNOSIS_PROMPT.format(
            equipment_metadata=str(equipment_metadata),
            building_context=str({}),
            energy_trends=str({}),
            anomaly_data=str(anomaly_data),
        )

        result = groq_service.generate_structured_response(prompt)
        if result:
            return result
        return {
            "root_causes": [
                {
                    "cause": "Potential sensor drift or operational change",
                    "probability_percent": 70,
                    "evidence": "Statistical anomaly detected",
                }
            ],
            "immediate_actions": [
                {
                    "action": "Verify equipment readings",
                    "timeline": "24 hours",
                    "estimated_cost": 0,
                }
            ],
            "risk_assessment": {
                "failure_probability": 30,
                "repair_cost": 50000,
                "occupant_impact": "low",
            },
            "confidence_score": 65,
        }

    def get_equipment_health_summary(self, building_id: UUID) -> List[Dict]:
        """Get equipment health summary."""
        equipment_list = self.db.query(Equipment).filter(Equipment.building_id == building_id).all()
        return [
            {
                "id": str(eq.id),
                "type": eq.type,
                "health_score": eq.health_score,
                "status": "good" if eq.health_score > 70 else "warning" if eq.health_score > 50 else "critical",
                "last_anomaly": None,
            }
            for eq in equipment_list
        ]
