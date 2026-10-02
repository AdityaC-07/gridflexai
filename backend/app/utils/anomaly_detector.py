from __future__ import annotations

import logging
import math
from typing import List, Optional, Tuple

logger = logging.getLogger(__name__)


def calculate_z_score(readings: List[float], latest: float) -> float:
    """Calculate z-score."""
    if len(readings) < 2:
        return 0.0
    mean = sum(readings) / len(readings)
    variance = sum((r - mean) ** 2 for r in readings) / len(readings)
    std_dev = math.sqrt(variance)
    if std_dev == 0:
        return 0.0
    return (latest - mean) / std_dev


def detect_anomaly_statistical(readings: List[float], latest: float, threshold: float = 3.0) -> Tuple[bool, float]:
    """Detect anomaly using z-score."""
    z_score = calculate_z_score(readings, latest)
    return abs(z_score) > threshold, z_score


def calculate_variance_percent(baseline: float, current: float) -> float:
    """Calculate variance percentage."""
    if baseline <= 0:
        return 0.0
    return ((current - baseline) / baseline) * 100
