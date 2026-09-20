"""GridFlex Copilot agent — Amazon Bedrock Converse agentic loop.

Architecture
────────────
React frontend
    ↓  POST /api/v1/copilot/query
FastAPI router (api/copilot.py)
    ↓
run_copilot_query()     ← this file
    ↓
Bedrock Converse API (bedrock.py)
    ↓  toolUse
Permission check (permissions.py)
    ↓  if GRANTED
Tool execution (tools.py)
    ↓  toolResult
Bedrock Converse API (bedrock.py)  [continues conversation]
    ↓  end_turn
Final answer text
    ↓
CopilotQueryResponse

Safety guarantees
─────────────────
• Permission layer denies any tool not in the explicit allowlist BEFORE execution.
• No tool writes to any store (all tools are read-only or simulate-only).
• The loop terminates after MAX_TOOL_ROUNDS to prevent infinite loops.
• If Bedrock is unavailable, we return a deterministic fallback answer
  (the original rule-based engine) — we NEVER fabricate an AI answer.
"""
from __future__ import annotations

import logging
import time
from datetime import datetime, timezone

from app.config import config
from app.agents.gridflex_copilot.bedrock import (
    BedrockUnavailableError,
    BedrockModelError,
    converse,
    extract_text,
    extract_tool_uses,
    stop_reason,
    build_tool_result_message,
    build_assistant_tool_use_message,
)
from app.agents.gridflex_copilot.permissions import (
    check_tool_permitted,
    CopilotPermissionError,
)
from app.agents.gridflex_copilot.prompts import SYSTEM_PROMPT, build_tool_config
from app.agents.gridflex_copilot.tools import execute_tool
from app.agents.gridflex_copilot.schemas import (
    CopilotQueryResponse,
    CopilotQueryRequest,
    ToolCallRecord,
)

logger = logging.getLogger("app.agents.copilot.agent")

# Safety: maximum Converse turns (user→model→tool→model…) before forcing end
MAX_TOOL_ROUNDS = 6


# ─────────────────────────────────────────────────────────────────────────────
# Public entry point
# ─────────────────────────────────────────────────────────────────────────────

def run_copilot_query(request: CopilotQueryRequest) -> CopilotQueryResponse:
    """Entry point for the Copilot API.

    If BEDROCK_ENABLED=false or Bedrock is unreachable, falls back to the
    deterministic rule-based engine — never fabricates an LLM response.
    """
    now = datetime.now(timezone.utc).isoformat()

    if not config.bedrock_enabled:
        logger.info("Bedrock disabled — using deterministic fallback.")
        return _deterministic_fallback(request, now, reason="BEDROCK_ENABLED=false")

    # ── Real Bedrock path ──────────────────────────────────────────────────
    t0 = time.monotonic()
    try:
        result = _run_bedrock_loop(request)
        result.data_timestamp = now
        result.latency_ms = round((time.monotonic() - t0) * 1000, 1)
        return result

    except BedrockUnavailableError as exc:
        logger.warning("Bedrock unavailable — deterministic fallback: %s", exc)
        return _deterministic_fallback(
            request, now,
            reason=f"Bedrock unavailable: {exc}",
            mode="fallback",
        )

    except BedrockModelError as exc:
        logger.error("Bedrock model error — deterministic fallback: %s", exc)
        return _deterministic_fallback(
            request, now,
            reason=f"Bedrock model error: {exc}",
            mode="fallback",
        )

    except Exception as exc:
        logger.error("Unexpected error in Copilot loop: %s", exc, exc_info=True)
        return _deterministic_fallback(
            request, now,
            reason=f"Unexpected error: {exc}",
            mode="fallback",
        )


# ─────────────────────────────────────────────────────────────────────────────
# Bedrock Converse agentic loop
# ─────────────────────────────────────────────────────────────────────────────

def _run_bedrock_loop(request: CopilotQueryRequest) -> CopilotQueryResponse:
    """Execute the full Converse tool-use loop.

    Loop:
      1. Send user message to Bedrock.
      2. If stopReason == 'tool_use': execute each tool, append results, repeat.
      3. If stopReason == 'end_turn': extract final text, return.
      4. After MAX_TOOL_ROUNDS, force end regardless.
    """
    feeder_id = request.feeder_id or config.feeder_id

    # Build the initial user message with context hints
    user_text = _build_user_message(request)

    messages: list[dict] = [
        {"role": "user", "content": [{"text": user_text}]}
    ]

    tool_config = build_tool_config()
    tools_used: list[ToolCallRecord] = []
    sources: list[str] = []
    total_latency = 0.0

    for round_num in range(MAX_TOOL_ROUNDS + 1):
        logger.info("Converse round %d (model=%s)", round_num + 1, config.bedrock_model_id)

        response = converse(
            messages=messages,
            system_prompt=SYSTEM_PROMPT,
            tool_config=tool_config,
        )

        total_latency += response.get("_latency_ms", 0)
        sr = stop_reason(response)
        logger.info("stopReason=%s after round %d", sr, round_num + 1)

        if sr == "end_turn" or round_num == MAX_TOOL_ROUNDS:
            # Model is done — extract text and return
            answer = extract_text(response)
            if not answer:
                answer = (
                    "The model returned an empty response. "
                    "Please try rephrasing your question."
                )
            return CopilotQueryResponse(
                answer=answer,
                model=response.get("_model_id", config.bedrock_model_id),
                provider="Amazon Bedrock",
                tools_used=tools_used,
                sources=sorted(set(sources)),
                data_timestamp=datetime.now(timezone.utc).isoformat(),
                mode="live",
                latency_ms=round(total_latency, 1),
                feeder_id=feeder_id,
                event_id=request.event_id,
            )

        if sr == "tool_use":
            # Append assistant's tool-use message to conversation history
            messages.append(build_assistant_tool_use_message(response))

            # Execute each tool call in this round
            tool_uses = extract_tool_uses(response)
            for tu in tool_uses:
                tool_name    = tu["name"]
                tool_use_id  = tu["toolUseId"]
                tool_input   = tu["input"]

                # ── Permission check ──────────────────────────────────────
                try:
                    check_tool_permitted(tool_name)
                except CopilotPermissionError as perm_err:
                    logger.error("Permission denied for tool '%s': %s", tool_name, perm_err)
                    # Return a security-blocked tool result to Bedrock
                    messages.append(
                        build_tool_result_message(
                            tool_use_id,
                            f"PERMISSION DENIED: {perm_err}",
                            is_error=True,
                        )
                    )
                    tools_used.append(ToolCallRecord(
                        tool_name=tool_name,
                        tool_use_id=tool_use_id,
                        input_args=tool_input,
                        result_summary="PERMISSION DENIED",
                    ))
                    continue

                # ── Execute tool ──────────────────────────────────────────
                try:
                    result = execute_tool(tool_name, tool_input)
                    # Track sources
                    source_map = {
                        "get_current_grid_state":        "grid_state",
                        "get_forecast":                  "forecast",
                        "get_active_reliability_events": "reliability_events",
                        "get_reliability_event":         "reliability_events",
                        "get_flexibility_pool":          "flexibility_pool",
                        "get_spatial_state":             "spatial_state",
                        "get_reliability_metrics":       "reliability_metrics",
                        "simulate_optimization":         "simulation",
                        "explain_dispatch_plan":         "dispatch_plan",
                        "compare_forecast_actual":       "forecast_vs_actual",
                    }
                    if tool_name in source_map:
                        sources.append(source_map[tool_name])

                    result_summary = _summarise_result(tool_name, result)
                    tools_used.append(ToolCallRecord(
                        tool_name=tool_name,
                        tool_use_id=tool_use_id,
                        input_args=tool_input,
                        result_summary=result_summary,
                    ))

                    messages.append(
                        build_tool_result_message(tool_use_id, result, is_error=False)
                    )
                    logger.debug("Tool '%s' result summary: %s", tool_name, result_summary)

                except Exception as exc:
                    logger.error("Tool '%s' execution error: %s", tool_name, exc)
                    messages.append(
                        build_tool_result_message(
                            tool_use_id,
                            f"Tool execution failed: {exc}",
                            is_error=True,
                        )
                    )
                    tools_used.append(ToolCallRecord(
                        tool_name=tool_name,
                        tool_use_id=tool_use_id,
                        input_args=tool_input,
                        result_summary=f"ERROR: {exc}",
                    ))

        else:
            # Unexpected stop reason — end gracefully
            logger.warning("Unexpected stopReason '%s' — ending loop", sr)
            answer = extract_text(response) or "Unexpected response from model."
            return CopilotQueryResponse(
                answer=answer,
                model=response.get("_model_id", config.bedrock_model_id),
                provider="Amazon Bedrock",
                tools_used=tools_used,
                sources=sorted(set(sources)),
                data_timestamp=datetime.now(timezone.utc).isoformat(),
                mode="live",
                latency_ms=round(total_latency, 1),
                feeder_id=feeder_id,
                event_id=request.event_id,
            )

    # Should not reach here
    raise RuntimeError("Converse loop exceeded MAX_TOOL_ROUNDS without returning.")


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _build_user_message(request: CopilotQueryRequest) -> str:
    """Build the user message with context hints for better grounding."""
    parts = [request.message]

    if request.feeder_id and request.feeder_id != "F01":
        parts.append(f"[Context: Feeder ID = {request.feeder_id}]")
    else:
        parts.append("[Context: Feeder F01 — Dharavi North, Mumbai, MSEDCL]")

    if request.event_id:
        parts.append(f"[Context: Reliability event ID = {request.event_id}]")

    if request.context:
        parts.append(f"[Additional context: {request.context}]")

    return "\n".join(parts)


def _summarise_result(tool_name: str, result: dict) -> str:
    """Create a one-line summary of a tool result for logging/display."""
    if not isinstance(result, dict):
        return str(result)[:120]

    if tool_name == "get_current_grid_state":
        return (
            f"risk={result.get('risk_level')} "
            f"gap={result.get('net_gap_kw')}kW "
            f"soc={result.get('battery_soc_pct')}%"
        )
    if tool_name == "get_forecast":
        return (
            f"peak_demand={result.get('next_4h_peak_demand_kw')}kW "
            f"peak_gap={result.get('next_4h_peak_gap_kw')}kW "
            f"confidence={result.get('confidence')}"
        )
    if tool_name == "get_active_reliability_events":
        return f"{result.get('active_event_count', 0)} active event(s)"
    if tool_name == "get_flexibility_pool":
        return (
            f"available={result.get('total_available_kw')}kW "
            f"resources={result.get('resource_count')}"
        )
    if tool_name == "simulate_optimization":
        opt = result.get("optimization", {})
        return (
            f"unserved={opt.get('total_unserved_kwh')}kWh "
            f"reliability={opt.get('expected_reliability_pct')}%"
        )
    if tool_name == "get_reliability_metrics":
        return (
            f"gain={result.get('reliability_gain_pct')}% "
            f"avoided={result.get('unserved_energy_avoided_kwh')}kWh"
        )
    return str(result)[:120]


# ─────────────────────────────────────────────────────────────────────────────
# Deterministic fallback — used when Bedrock is unavailable
# ─────────────────────────────────────────────────────────────────────────────

def _deterministic_fallback(
    request: CopilotQueryRequest,
    timestamp: str,
    reason: str = "",
    mode: str = "fallback",
) -> CopilotQueryResponse:
    """Produce a deterministic answer using existing rule-based logic.

    This is NEVER presented as an AI answer — the response clearly marks
    it as a deterministic fallback with the reason Bedrock is unavailable.
    """
    # Call the tools directly (no LLM)
    from app.agents.gridflex_copilot.tools import (
        get_current_grid_state,
        get_active_reliability_events,
        get_flexibility_pool,
    )

    feeder_id = request.feeder_id or config.feeder_id
    state     = get_current_grid_state(feeder_id)
    events    = get_active_reliability_events(feeder_id)
    pool      = get_flexibility_pool(feeder_id)

    risk      = state.get("risk_level", "UNKNOWN")
    stress    = state.get("stress_index", "?")
    gap       = state.get("net_gap_kw", 0)
    demand    = state.get("demand_kw", "?")
    solar     = state.get("solar_kw", "?")
    soc       = state.get("battery_soc_pct", "?")
    n_events  = events.get("active_event_count", 0)
    pool_kw   = pool.get("total_available_kw", 0)

    answer = (
        f"⚠️ Amazon Bedrock is unavailable ({reason}). "
        f"Showing deterministic GridFlex data:\n\n"
        f"Feeder {feeder_id} — Risk: {risk} (stress {stress}/100)\n"
        f"Demand: {demand} kW | Solar: {solar} kW | Gap: {gap} kW\n"
        f"Battery SoC: {soc}% | Flexibility pool: {pool_kw} kW\n"
        f"Active reliability events: {n_events}\n\n"
        f"All deterministic GridFlex services remain fully operational. "
        f"Configure AWS credentials and set BEDROCK_ENABLED=true to enable AI explanations."
    )

    return CopilotQueryResponse(
        answer=answer,
        model=config.bedrock_model_id,
        provider="Amazon Bedrock (unavailable — deterministic fallback)",
        tools_used=[],
        sources=["grid_state", "reliability_events", "flexibility_pool"],
        data_timestamp=timestamp,
        mode=mode,
        latency_ms=None,
        feeder_id=feeder_id,
        event_id=request.event_id,
    )
