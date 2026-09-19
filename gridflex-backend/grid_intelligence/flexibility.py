"""Consent-aware flexible-load inventory (MVP)."""
from __future__ import annotations

# per-household kW + max shift hours for the MVP inventory
FLEXIBLE_LOAD_CATALOG = {
    "water_heater": {"kw_per_household": 2.0, "max_shift_hours": 3.0},
    "non_essential_ac": {"kw_per_household": 1.5, "max_shift_hours": 2.0},
    "ev_charging": {"kw_per_household": 3.0, "max_shift_hours": 4.0},
}


def calculate_flexibility(
    enrolled_households: dict | None = None,
    consent: dict | None = None,
    total_households: int = 50,
) -> dict:
    enrolled_households = enrolled_households or {
        "water_heater": 30,
        "non_essential_ac": 25,
        "ev_charging": 10,
    }
    consent = consent or {"water_heater": True, "non_essential_ac": True, "ev_charging": True}
    breakdown: list[dict] = []
    total = 0.0
    for load_type, spec in FLEXIBLE_LOAD_CATALOG.items():
        if not consent.get(load_type, False):
            continue  # consent-aware: excluded when consent is false
        n = max(0, int(enrolled_households.get(load_type, 0)))
        avail = round(n * spec["kw_per_household"], 2)
        total += avail
        breakdown.append({
            "load_type": load_type,
            "available_kw": avail,
            "enrolled_households": n,
            "max_shift_hours": spec["max_shift_hours"],
        })
    return {"total_flexible_kw": round(total, 2), "load_breakdown": breakdown}
