"""Seed flexibility pool with mock resources for demonstration."""
from __future__ import annotations

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from shared import dynamo as db
from shared.config import settings

MOCK_RESOURCES = [
    {
        "resource_id": "RES-BAT-001",
        "feeder_id": settings.feeder_id,
        "resource_type": "battery",
        "resource_name": "Community Battery",
        "available_kw": 45.0,
        "max_duration_minutes": 120,
        "response_time_minutes": 0,
        "min_operation_pct": 10.0,
        "max_operation_pct": 90.0,
        "criticality": "infrastructure",
        "comfort_impact": "none",
        "owner_type": "community",
        "location_section": "Section B",
        "enrolled": True,
        "availability": 0.95,
        "response_reliability": 0.99,
        "disruption_weight": 0.1,
    },
    {
        "resource_id": "RES-EV-001",
        "feeder_id": settings.feeder_id,
        "resource_type": "ev_charging",
        "resource_name": "EV Charging Cluster A",
        "available_kw": 12.0,
        "max_duration_minutes": 60,
        "response_time_minutes": 5,
        "min_operation_pct": 0.0,
        "max_operation_pct": 100.0,
        "criticality": "deferrable",
        "comfort_impact": "low",
        "owner_type": "resident",
        "location_section": "Section C",
        "enrolled": True,
        "availability": 0.85,
        "response_reliability": 0.90,
        "disruption_weight": 0.3,
    },
    {
        "resource_id": "RES-EV-002",
        "feeder_id": settings.feeder_id,
        "resource_type": "ev_charging",
        "resource_name": "EV Charging Cluster B",
        "available_kw": 10.0,
        "max_duration_minutes": 60,
        "response_time_minutes": 5,
        "min_operation_pct": 0.0,
        "max_operation_pct": 100.0,
        "criticality": "deferrable",
        "comfort_impact": "low",
        "owner_type": "resident",
        "location_section": "Section C",
        "enrolled": True,
        "availability": 0.85,
        "response_reliability": 0.90,
        "disruption_weight": 0.3,
    },
    {
        "resource_id": "RES-HVAC-001",
        "feeder_id": settings.feeder_id,
        "resource_type": "hvac",
        "resource_name": "HVAC Building Complex",
        "available_kw": 18.0,
        "max_duration_minutes": 45,
        "response_time_minutes": 10,
        "min_operation_pct": 50.0,
        "max_operation_pct": 100.0,
        "criticality": "comfort",
        "comfort_impact": "medium",
        "owner_type": "commercial",
        "location_section": "Section B",
        "enrolled": True,
        "availability": 0.70,
        "response_reliability": 0.80,
        "disruption_weight": 0.6,
    },
    {
        "resource_id": "RES-PUMP-001",
        "feeder_id": settings.feeder_id,
        "resource_type": "water_pump",
        "resource_name": "Water Pump Block C",
        "available_kw": 12.0,
        "max_duration_minutes": 90,
        "response_time_minutes": 2,
        "min_operation_pct": 0.0,
        "max_operation_pct": 100.0,
        "criticality": "deferrable",
        "comfort_impact": "low",
        "owner_type": "municipal",
        "location_section": "Section A",
        "enrolled": True,
        "availability": 0.90,
        "response_reliability": 0.95,
        "disruption_weight": 0.4,
    },
    {
        "resource_id": "RES-WH-001",
        "feeder_id": settings.feeder_id,
        "resource_type": "water_heater",
        "resource_name": "Water Heater Cluster",
        "available_kw": 8.0,
        "max_duration_minutes": 60,
        "response_time_minutes": 0,
        "min_operation_pct": 0.0,
        "max_operation_pct": 100.0,
        "criticality": "deferrable",
        "comfort_impact": "low",
        "owner_type": "resident",
        "location_section": "Section A",
        "enrolled": True,
        "availability": 0.85,
        "response_reliability": 0.92,
        "disruption_weight": 0.3,
    },
    {
        "resource_id": "RES-COM-001",
        "feeder_id": settings.feeder_id,
        "resource_type": "commercial_load",
        "resource_name": "Small Business Loads",
        "available_kw": 29.0,
        "max_duration_minutes": 30,
        "response_time_minutes": 15,
        "min_operation_pct": 50.0,
        "max_operation_pct": 100.0,
        "criticality": "semi_critical",
        "comfort_impact": "high",
        "owner_type": "commercial",
        "location_section": "Section B",
        "enrolled": True,
        "availability": 0.70,
        "response_reliability": 0.85,
        "disruption_weight": 0.9,
    },
    {
        "resource_id": "RES-SOL-001",
        "feeder_id": settings.feeder_id,
        "resource_type": "rooftop_solar",
        "resource_name": "Rooftop Solar Export",
        "available_kw": 6.0,
        "max_duration_minutes": 9999,
        "response_time_minutes": 0,
        "min_operation_pct": 0.0,
        "max_operation_pct": 100.0,
        "criticality": "deferrable",
        "comfort_impact": "none",
        "owner_type": "resident",
        "location_section": "Section C",
        "enrolled": True,
        "availability": 0.60,
        "response_reliability": 0.95,
        "disruption_weight": 0.1,
    },
]


def main() -> None:
    print(f"Seeding flexibility pool for feeder {settings.feeder_id}...")
    for resource in MOCK_RESOURCES:
        try:
            db.write_flexibility_resource(resource)
            print(f"  ✓ {resource['resource_id']}: {resource['resource_name']} ({resource['available_kw']} kW)")
        except Exception as exc:
            print(f"  ✗ Failed to write {resource['resource_id']}: {exc}")
    print("Done.")


if __name__ == "__main__":
    main()
