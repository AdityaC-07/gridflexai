"""Flexibility Pool Assembly: resource ranking + reliability budget scoring."""
from __future__ import annotations

import logging
from typing import Any

from shared import dynamo as db

logger = logging.getLogger("grid-intelligence.pool-assembly")


def calculate_reliability_budget_score(resource: dict[str, Any]) -> float:
    """Calculate Reliability Budget Score (RBS) for a resource.

    RBS = (reliability_value / disruption_weight) × flexibility_confidence × availability

    reliability_value is inverse of disruption_weight (higher disruption = lower value)
    """
    disruption_weight = float(resource.get("disruption_weight", 0.5))
    availability = float(resource.get("availability", 1.0))
    response_reliability = float(resource.get("response_reliability", 0.95))

    # Simplified forecast accuracy factor (would come from forecast service in production)
    forecast_accuracy = 0.85

    flexibility_confidence = availability * response_reliability * forecast_accuracy

    # Reliability value: inverse of disruption weight (with small epsilon to avoid division by zero)
    reliability_value = 1.0 / (disruption_weight + 0.01)

    rbs = (reliability_value / disruption_weight) * flexibility_confidence * availability
    return round(rbs, 3)


def assemble_flexibility_pool(feeder_id: str, gap_kw: float = 0.0) -> dict[str, Any]:
    """Assemble and rank the flexibility pool for a feeder.

    Returns:
        dict with:
            - resources: list of ranked resources with RBS
            - total_available_kw: sum of all available kW
            - total_needed_kw: gap to cover
            - coverage_ratio: available/needed ratio
    """
    try:
        raw_resources = db.get_feeder_flexibility_pool(feeder_id)
    except Exception as exc:
        logger.warning("Failed to get flexibility pool: %s", exc)
        raw_resources = []

    # Calculate RBS for each resource
    for resource in raw_resources:
        try:
            rbs = calculate_reliability_budget_score(resource)
            resource["reliability_budget_score"] = rbs
        except Exception as exc:
            logger.warning("Failed to calculate RBS for resource %s: %s", resource.get("resource_id"), exc)
            resource["reliability_budget_score"] = 0.0

    # Sort by RBS (highest first), then by disruption weight (lowest first)
    ranked_resources = sorted(
        raw_resources,
        key=lambda r: (
            -float(r.get("reliability_budget_score", 0.0)),
            float(r.get("disruption_weight", 1.0))
        )
    )

    total_available = sum(float(r.get("available_kw", 0)) for r in ranked_resources)
    coverage_ratio = total_available / gap_kw if gap_kw > 0 else float('inf')

    return {
        "feeder_id": feeder_id,
        "resources": ranked_resources,
        "total_available_kw": round(total_available, 2),
        "total_needed_kw": round(gap_kw, 2),
        "coverage_ratio": round(coverage_ratio, 3) if coverage_ratio != float('inf') else 0.0,
        "has_sufficient_coverage": total_available >= gap_kw if gap_kw > 0 else True,
    }


def select_resources_for_dispatch(pool: dict[str, Any], required_kw: float, max_resources: int = 10) -> list[dict[str, Any]]:
    """Select resources from the pool to meet the required kW.

    Selects highest RBS resources first until required kW is met or max_resources reached.
    """
    resources = pool.get("resources", [])
    selected = []
    cumulative_kw = 0.0

    for resource in resources[:max_resources]:
        if cumulative_kw >= required_kw:
            break
        selected.append(resource)
        cumulative_kw += float(resource.get("available_kw", 0))

    return selected
