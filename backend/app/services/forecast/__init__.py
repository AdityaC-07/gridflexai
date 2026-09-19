"""Forecast service: demand (Ridge regression) + solar (physics model) -> 48-slot forecast."""
from .service import ForecastService, forecast_service

__all__ = ["ForecastService", "forecast_service"]
