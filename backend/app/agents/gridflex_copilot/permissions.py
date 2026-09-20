"""GridFlex Copilot — permission layer.

This module enforces a strict READ-only / SIMULATE-only policy for the AI
Copilot. It is the last defence before a tool call reaches GridFlex services.

ALLOWED categories
──────────────────
  READ      — query live state, forecasts, events, pool, metrics
  SIMULATE  — run in-memory optimization scenarios (results NOT persisted)

DENIED categories (raise PermissionError immediately)
──────────────────────────────────────────────────────
  DISPATCH                  — no direct grid control
  APPROVE                   — no decision approval
  SAFETY_POLICY_MODIFY      — no battery reserve / critical-load threshold changes
  TELEMETRY_MODIFY          — no sensor data tampering
  INFRASTRUCTURE_MODIFY     — no AWS resource changes
  EXECUTE_ARBITRARY_CODE    — no generic code execution
  UNRESTRICTED_DATABASE     — no raw DynamoDB / SQL access

The permitted set is an ALLOWLIST — anything not explicitly permitted is denied.

Usage
─────
    from app.agents.gridflex_copilot.permissions import check_tool_permitted

    check_tool_permitted("get_current_grid_state")   # OK
    check_tool_permitted("approve_decision")          # raises PermissionError
"""
from __future__ import annotations

import logging

logger = logging.getLogger("app.agents.copilot.permissions")

# ─────────────────────────────────────────────────────────────────────────────
# Allowlist — only these tool names may be called by the Copilot
# ─────────────────────────────────────────────────────────────────────────────

_PERMITTED_TOOLS: frozenset[str] = frozenset({
    # READ — live grid state
    "get_current_grid_state",
    # READ — forecast data
    "get_forecast",
    # READ — active reliability events list
    "get_active_reliability_events",
    # READ — single reliability event detail
    "get_reliability_event",
    # READ — ranked flexibility pool
    "get_flexibility_pool",
    # READ — spatial / feeder digital-twin state
    "get_spatial_state",
    # READ — baseline-vs-GridFlex reliability metrics
    "get_reliability_metrics",
    # SIMULATE — in-memory optimization scenario (NOT persisted)
    "simulate_optimization",
    # READ — explain an existing dispatch plan
    "explain_dispatch_plan",
    # READ — compare forecast vs actual for an event
    "compare_forecast_actual",
})

# ─────────────────────────────────────────────────────────────────────────────
# Denylist (for explicitness in tests — anything NOT in the allowlist is
# already denied; this list documents intent and drives test assertions)
# ─────────────────────────────────────────────────────────────────────────────

_EXPLICITLY_PROHIBITED: frozenset[str] = frozenset({
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
    # Telemetry
    "write_telemetry",
    "ingest_telemetry",
    "modify_telemetry",
    # Infrastructure
    "modify_aws_infrastructure",
    "create_dynamodb_table",
    "delete_dynamodb_table",
    "put_dynamodb_item",
    "update_dynamodb_item",
    # Generic dangerous operations
    "execute_code",
    "run_sql",
    "run_query",
    "unrestricted_database",
    "shell_exec",
})


class CopilotPermissionError(PermissionError):
    """Raised when the Copilot attempts a prohibited operation."""

    def __init__(self, tool_name: str, reason: str = "") -> None:
        self.tool_name = tool_name
        msg = (
            f"SECURITY: Copilot attempted prohibited tool '{tool_name}'. "
            f"{reason} "
            "This call was blocked by the GridFlex permission layer. "
            "The Copilot is READ-ONLY and SIMULATE-ONLY."
        )
        super().__init__(msg)
        logger.error("PERMISSION DENIED: tool='%s' reason='%s'", tool_name, reason)


def check_tool_permitted(tool_name: str) -> None:
    """Raise CopilotPermissionError if tool_name is not in the allowlist.

    This is called BEFORE every tool execution in the Converse loop.

    Args:
        tool_name: The tool name requested by Bedrock.

    Raises:
        CopilotPermissionError: If tool_name is not in _PERMITTED_TOOLS.
    """
    if tool_name in _PERMITTED_TOOLS:
        logger.debug("PERMISSION GRANTED: tool='%s'", tool_name)
        return

    reason = ""
    if tool_name in _EXPLICITLY_PROHIBITED:
        reason = f"'{tool_name}' is in the explicit prohibition list."
    else:
        reason = f"'{tool_name}' is not in the Copilot allowlist."

    raise CopilotPermissionError(tool_name, reason)


def permitted_tool_names() -> list[str]:
    """Return the sorted list of all permitted tool names."""
    return sorted(_PERMITTED_TOOLS)


def prohibited_tool_names() -> list[str]:
    """Return the sorted list of explicitly prohibited tool names."""
    return sorted(_EXPLICITLY_PROHIBITED)
