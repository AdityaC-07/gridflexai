"""Test reliability event schema fix for DynamoDB key structure."""
from __future__ import annotations

import pytest
from datetime import datetime, timezone, timedelta


def test_event_creation_has_required_keys():
    """Test that reliability events include feeder_id and timestamp for DynamoDB keys."""
    # Test the event structure directly
    from datetime import datetime, timezone

    timestamp = datetime.now(timezone.utc)
    timestamp_iso = timestamp.isoformat()

    event = {
        "event_id": "GF-F01-20260919-1800",
        "feeder_id": "F01",
        "timestamp": timestamp_iso,  # DynamoDB sort key
        "status": "PREDICTED",
        "predicted_gap_kw": 25.0,
        "duration_minutes": 30,
        "risk_level": "HIGH",
        "critical_load_kw": 48.0,
        "flexibility_available_kw": 100.0,
        "dispatch_plan": None,
        "battery_reserve_after_pct": None,
        "forecast_confidence": 0.8,
        "created_at": timestamp_iso,
        "approved_at": None,
        "verified_at": None,
        "outcome": None,
    }

    assert "feeder_id" in event, "Event must have feeder_id for DynamoDB partition key"
    assert "timestamp" in event, "Event must have timestamp for DynamoDB sort key"
    assert "event_id" in event, "Event must have event_id for application-level identifier"
    assert event["feeder_id"] == "F01"
    assert event["timestamp"] is not None
    # Verify timestamp is ISO format
    try:
        datetime.fromisoformat(event["timestamp"])
    except ValueError:
        pytest.fail("timestamp must be valid ISO format")
    # Verify timestamp is UTC
    assert "Z" in event["timestamp"] or "+" in event["timestamp"]


def test_event_write_preserves_keys():
    """Test that writing events preserves feeder_id and timestamp."""
    from app.core.store import write_reliability_event, get_reliability_event
    from app.core.store import _reliability_events, _lock

    # Clear any existing events
    with _lock:
        _reliability_events.clear()

    event = {
        "event_id": "TEST-EVENT-001",
        "feeder_id": "F01",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "status": "PREDICTED",
        "predicted_gap_kw": 25.0,
        "duration_minutes": 30,
        "risk_level": "HIGH",
        "critical_load_kw": 48.0,
        "flexibility_available_kw": 100.0,
        "dispatch_plan": None,
        "battery_reserve_after_pct": None,
        "forecast_confidence": 0.8,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "approved_at": None,
        "verified_at": None,
        "outcome": None,
    }

    written = write_reliability_event(event)
    assert written["feeder_id"] == "F01"
    assert written["timestamp"] is not None
    assert written["event_id"] == "TEST-EVENT-001"

    # Read back by event_id
    retrieved = get_reliability_event("TEST-EVENT-001")
    assert retrieved is not None
    assert retrieved["feeder_id"] == "F01"
    assert retrieved["timestamp"] == event["timestamp"]
    assert retrieved["event_id"] == "TEST-EVENT-001"


def test_event_update_preserves_keys():
    """Test that event updates preserve feeder_id and timestamp."""
    from app.core.store import write_reliability_event, get_reliability_event
    from app.core.store import _reliability_events, _lock

    # Clear any existing events
    with _lock:
        _reliability_events.clear()

    # Create initial event
    initial_timestamp = datetime.now(timezone.utc).isoformat()
    event = {
        "event_id": "TEST-EVENT-002",
        "feeder_id": "F01",
        "timestamp": initial_timestamp,
        "status": "PREDICTED",
        "predicted_gap_kw": 25.0,
        "duration_minutes": 30,
        "risk_level": "HIGH",
        "critical_load_kw": 48.0,
        "flexibility_available_kw": 100.0,
        "dispatch_plan": None,
        "battery_reserve_after_pct": None,
        "forecast_confidence": 0.8,
        "created_at": initial_timestamp,
        "approved_at": None,
        "verified_at": None,
        "outcome": None,
    }

    write_reliability_event(event)

    # Update status
    event["status"] = "OPERATOR_APPROVED"
    event["approved_at"] = datetime.now(timezone.utc).isoformat()
    event["approved_by"] = "operator"

    updated = write_reliability_event(event)

    # Verify keys are preserved
    assert updated["feeder_id"] == "F01"
    assert updated["timestamp"] == initial_timestamp  # Must not change
    assert updated["event_id"] == "TEST-EVENT-002"
    assert updated["status"] == "OPERATOR_APPROVED"


def test_get_events_by_feeder():
    """Test that events can be retrieved by feeder_id."""
    from app.core.store import write_reliability_event, get_recent_reliability_events
    from app.core.store import _reliability_events, _lock

    # Clear any existing events
    with _lock:
        _reliability_events.clear()

    # Create events for different feeders
    timestamp1 = datetime.now(timezone.utc).isoformat()
    timestamp2 = datetime.now(timezone.utc).isoformat()

    event1 = {
        "event_id": "TEST-EVENT-F01-001",
        "feeder_id": "F01",
        "timestamp": timestamp1,
        "status": "PREDICTED",
        "predicted_gap_kw": 25.0,
        "duration_minutes": 30,
        "risk_level": "HIGH",
        "critical_load_kw": 48.0,
        "flexibility_available_kw": 100.0,
        "dispatch_plan": None,
        "battery_reserve_after_pct": None,
        "forecast_confidence": 0.8,
        "created_at": timestamp1,
        "approved_at": None,
        "verified_at": None,
        "outcome": None,
    }

    event2 = {
        "event_id": "TEST-EVENT-F02-001",
        "feeder_id": "F02",
        "timestamp": timestamp2,
        "status": "PREDICTED",
        "predicted_gap_kw": 20.0,
        "duration_minutes": 30,
        "risk_level": "HIGH",
        "critical_load_kw": 48.0,
        "flexibility_available_kw": 100.0,
        "dispatch_plan": None,
        "battery_reserve_after_pct": None,
        "forecast_confidence": 0.8,
        "created_at": timestamp2,
        "approved_at": None,
        "verified_at": None,
        "outcome": None,
    }

    write_reliability_event(event1)
    write_reliability_event(event2)

    # Get events for F01 only
    f01_events = get_recent_reliability_events("F01", limit=10)
    assert len(f01_events) == 1
    assert f01_events[0]["feeder_id"] == "F01"
    assert f01_events[0]["event_id"] == "TEST-EVENT-F01-001"

    # Get events for F02 only
    f02_events = get_recent_reliability_events("F02", limit=10)
    assert len(f02_events) == 1
    assert f02_events[0]["feeder_id"] == "F02"
    assert f02_events[0]["event_id"] == "TEST-EVENT-F02-001"


def test_get_active_events_filters_status():
    """Test that active events are filtered by status."""
    from app.core.store import write_reliability_event, get_active_reliability_events
    from app.core.store import _reliability_events, _lock

    # Clear any existing events
    with _lock:
        _reliability_events.clear()

    # Use different timestamps to avoid key collisions
    timestamp1 = datetime.now(timezone.utc).isoformat()
    timestamp2 = (datetime.now(timezone.utc) + timedelta(seconds=30)).isoformat()

    # Create events with different statuses
    active_event = {
        "event_id": "TEST-EVENT-ACTIVE-001",
        "feeder_id": "F01",
        "timestamp": timestamp1,
        "status": "PREDICTED",
        "predicted_gap_kw": 25.0,
        "duration_minutes": 30,
        "risk_level": "HIGH",
        "critical_load_kw": 48.0,
        "flexibility_available_kw": 100.0,
        "dispatch_plan": None,
        "battery_reserve_after_pct": None,
        "forecast_confidence": 0.8,
        "created_at": timestamp1,
        "approved_at": None,
        "verified_at": None,
        "outcome": None,
    }

    closed_event = {
        "event_id": "TEST-EVENT-CLOSED-001",
        "feeder_id": "F01",
        "timestamp": timestamp2,
        "status": "CLOSED",
        "predicted_gap_kw": 25.0,
        "duration_minutes": 30,
        "risk_level": "HIGH",
        "critical_load_kw": 48.0,
        "flexibility_available_kw": 100.0,
        "dispatch_plan": None,
        "battery_reserve_after_pct": None,
        "forecast_confidence": 0.8,
        "created_at": timestamp2,
        "approved_at": None,
        "verified_at": None,
        "outcome": None,
    }

    write_reliability_event(active_event)
    write_reliability_event(closed_event)

    # Get active events for F01
    active_events = get_active_reliability_events("F01")
    assert len(active_events) == 1
    assert active_events[0]["status"] == "PREDICTED"
    assert active_events[0]["event_id"] == "TEST-EVENT-ACTIVE-001"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
