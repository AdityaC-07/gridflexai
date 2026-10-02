from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.building import Building, Equipment, EnergyConsumption
from app.utils.baseline_calculator import calculate_baseline

logger = logging.getLogger(__name__)

CLIMATE_ZONES = ["tropical_wet", "warm_humid", "composite", "temperate", "cold"]


class BuildingNotFound(Exception):
    pass


class InvalidClimateZone(Exception):
    pass


class BuildingService:
    """Building service for CRUD operations and energy analytics."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def create_building(self, building_data: Dict) -> Building:
        """Create a new building."""
        climate_zone = building_data.get("climate_zone")
        if climate_zone not in CLIMATE_ZONES:
            raise InvalidClimateZone(f"Invalid climate zone: {climate_zone}")

        building = Building(
            name=building_data["name"],
            area_sqm=building_data["area_sqm"],
            climate_zone=climate_zone,
            occupancy_pax=building_data["occupancy_pax"],
            tariff_peak_window=building_data["tariff_peak_window"],
            ecbc_compliant=building_data.get("ecbc_compliant", False),
        )
        self.db.add(building)
        self.db.commit()
        self.db.refresh(building)
        logger.info("Created building: %s", building.name)
        return building

    def get_building(self, building_id: UUID) -> Optional[Building]:
        """Get building by ID with relationships."""
        return (
            self.db.query(Building)
            .filter(Building.id == building_id)
            .first()
        )

    def list_buildings(self, skip: int = 0, limit: int = 100) -> List[Building]:
        """List buildings."""
        return self.db.query(Building).offset(skip).limit(limit).all()

    def update_building(self, building_id: UUID, updates: Dict) -> Building:
        """Update building."""
        building = self.get_building(building_id)
        if not building:
            raise BuildingNotFound(f"Building {building_id} not found")

        for key, value in updates.items():
            if hasattr(building, key):
                setattr(building, key, value)

        self.db.commit()
        self.db.refresh(building)
        return building

    def delete_building(self, building_id: UUID) -> bool:
        """Delete building."""
        building = self.get_building(building_id)
        if not building:
            return False
        self.db.delete(building)
        self.db.commit()
        return True

    def ingest_consumption(
        self,
        building_id: UUID,
        timestamp: datetime,
        kwh_total: float,
        kwh_hvac: float = 0.0,
        kwh_lighting: float = 0.0,
        kwh_plug: float = 0.0,
    ) -> EnergyConsumption:
        """Ingest energy consumption data."""
        building = self.get_building(building_id)
        if not building:
            raise BuildingNotFound(f"Building {building_id} not found")

        baseline = calculate_baseline(building.climate_zone, kwh_total)

        # Flag anomalies if kwh_total > baseline * 1.2
        anomaly_flag = kwh_total > baseline * 1.2 if baseline > 0 else False

        consumption = EnergyConsumption(
            building_id=building_id,
            timestamp=timestamp,
            kwh_total=kwh_total,
            kwh_hvac=kwh_hvac,
            kwh_lighting=kwh_lighting,
            kwh_plug=kwh_plug,
            baseline_kwh=baseline,
            anomaly_flag=anomaly_flag,
        )
        self.db.add(consumption)
        self.db.commit()
        self.db.refresh(consumption)
        return consumption

    def get_consumption_timeseries(self, building_id: UUID, days: int = 7) -> List[EnergyConsumption]:
        """Get consumption timeseries for last N days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        return (
            self.db.query(EnergyConsumption)
            .filter(
                EnergyConsumption.building_id == building_id,
                EnergyConsumption.timestamp >= cutoff,
            )
            .order_by(EnergyConsumption.timestamp.asc())
            .all()
        )

    def get_efficiency_vs_baseline(self, building_id: UUID) -> Dict:
        """Get efficiency vs baseline."""
        building = self.get_building(building_id)
        if not building:
            raise BuildingNotFound(f"Building {building_id} not found")

        latest = (
            self.db.query(EnergyConsumption)
            .filter(EnergyConsumption.building_id == building_id)
            .order_by(EnergyConsumption.timestamp.desc())
            .first()
        )

        if not latest:
            return {
                "consumption_kwh": 0,
                "baseline_kwh": 0,
                "variance_percent": 0,
                "efficiency_badge": "NEUTRAL",
            }

        consumption_kwh = latest.kwh_total
        baseline_kwh = latest.baseline_kwh or consumption_kwh

        if baseline_kwh > 0:
            variance_percent = ((consumption_kwh - baseline_kwh) / baseline_kwh) * 100
        else:
            variance_percent = 0

        if variance_percent < -5:
            efficiency_badge = "EXCELLENT"
        elif variance_percent < 5:
            efficiency_badge = "GOOD"
        elif variance_percent < 15:
            efficiency_badge = "FAIR"
        else:
            efficiency_badge = "POOR"

        return {
            "consumption_kwh": consumption_kwh,
            "baseline_kwh": baseline_kwh,
            "variance_percent": round(variance_percent, 2),
            "efficiency_badge": efficiency_badge,
        }

    def get_building_profile(self, building_id: UUID) -> Dict:
        """Get building profile with equipment."""
        building = self.get_building(building_id)
        if not building:
            raise BuildingNotFound(f"Building {building_id} not found")

        equipment_list = [
            {
                "id": str(eq.id),
                "type": eq.type,
                "health_score": eq.health_score,
                "age_years": eq.age_years,
                "last_maintenance": eq.last_maintenance.isoformat() if eq.last_maintenance else None,
            }
            for eq in building.equipment
        ]

        return {
            "id": str(building.id),
            "name": building.name,
            "area_sqm": building.area_sqm,
            "climate_zone": building.climate_zone,
            "occupancy_pax": building.occupancy_pax,
            "tariff_peak_window": building.tariff_peak_window,
            "ecbc_compliant": building.ecbc_compliant,
            "equipment": equipment_list,
        }
