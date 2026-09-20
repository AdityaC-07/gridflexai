"""Unit tests for the Copilot permission layer.

These tests prove that the Copilot CANNOT call prohibited operations.
All tests run without AWS credentials or Bedrock access.
"""
import pytest

from app.agents.gridflex_copilot.permissions import (
    check_tool_permitted,
    CopilotPermissionError,
    permitted_tool_names,
    prohibited_tool_names,
    _PERMITTED_TOOLS,
    _EXPLICITLY_PROHIBITED,
)


# ─────────────────────────────────────────────────────────────────────────────
# Permitted tools — must NOT raise
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("tool_name", [
    "get_current_grid_state",
    "get_forecast",
    "get_active_reliability_events",
    "get_reliability_event",
    "get_flexibility_pool",
    "get_spatial_state",
    "get_reliability_metrics",
    "simulate_optimization",
    "explain_dispatch_plan",
    "compare_forecast_actual",
])
def test_permitted_tools_pass(tool_name):
    """All 10 GridFlex read/simulate tools must be permitted."""
    check_tool_permitted(tool_name)  # must not raise


# ─────────────────────────────────────────────────────────────────────────────
# Prohibited operations — MUST raise CopilotPermissionError
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.parametrize("tool_name", [
    # Dispatch & approval
    "dispatch",
    "approve_decision",
    "approve_reliability_event",
    "execute_dispatch_plan",
    "trigger_dispatch",
    # Safety policy
    "modify_battery_reserve",
    "set_critical_load_threshold",
    "disable_critical_load_protection",
    "modify_safety_thresholds",
    # Telemetry mutation
    "write_telemetry",
    "ingest_telemetry",
    "modify_telemetry",
    # Infrastructure
    "modify_aws_infrastructure",
    "create_dynamodb_table",
    "delete_dynamodb_table",
    "put_dynamodb_item",
    "update_dynamodb_item",
    # Generic dangerous
    "execute_code",
    "run_sql",
    "run_query",
    "unrestricted_database",
    "shell_exec",
])
def test_prohibited_tools_raise(tool_name):
    """Explicitly prohibited tools MUST raise CopilotPermissionError."""
    with pytest.raises(CopilotPermissionError) as exc_info:
        check_tool_permitted(tool_name)
    assert tool_name in str(exc_info.value)


def test_unknown_tool_raises():
    """Any tool not in the allowlist must be denied — even novel names."""
    with pytest.raises(CopilotPermissionError):
        check_tool_permitted("some_made_up_tool_name_xyz")


def test_empty_string_raises():
    with pytest.raises(CopilotPermissionError):
        check_tool_permitted("")


def test_permitted_tool_names_returns_all_ten():
    names = permitted_tool_names()
    assert len(names) == 10
    assert "get_current_grid_state" in names
    assert "simulate_optimization" in names


def test_prohibited_set_does_not_overlap_permitted():
    """The allowlist and the denylist must be disjoint."""
    overlap = _PERMITTED_TOOLS & _EXPLICITLY_PROHIBITED
    assert overlap == frozenset(), f"Overlap detected: {overlap}"


def test_permission_error_is_subclass_of_permission_error():
    with pytest.raises(PermissionError):
        check_tool_permitted("dispatch")
