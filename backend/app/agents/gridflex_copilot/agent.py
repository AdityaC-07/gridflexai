"""GridFlex Copilot agent — rule-based explanation engine (MVP).

Architecture
────────────
This module is the only place that knows HOW to answer questions.
It calls CopilotToolkit methods (read-only) and generates explanations.

To replace this with an LLM backend in the future:
  1. Create a new agent module (e.g. bedrock_agent.py)
  2. Have it call the same CopilotToolkit methods as tools
  3. Change the import in api/copilot.py to use the new agent

The tools interface (tools.py) remains stable.

CONSTRAINT: This agent NEVER calls service write methods.
"""
from __future__ import annotations

import logging

from app.agents.gridflex_copilot.tools import CopilotToolkit

logger = logging.getLogger("app.agents.copilot.agent")

_toolkit = CopilotToolkit()


def answer_question(
    question: str,
    feeder_id: str = "F01",
    event_id: str | None = None,
) -> dict:
    """Answer a natural-language question about the grid state.

    Returns a structured response with:
      question, answer, context (tool outputs), sources.
    """
    context: dict = {}
    sources: list[str] = []

    # Gather context via read-only tools
    feeder_state = _toolkit.get_current_feeder_state(feeder_id)
    context["feeder_state"] = {
        "demand_kw": feeder_state.get("demand_kw"),
        "solar_kw": feeder_state.get("solar_kw"),
        "risk_level": feeder_state.get("risk_level"),
        "stress_index": feeder_state.get("stress_index"),
        "net_gap_kw": feeder_state.get("net_gap_kw"),
        "battery_soc_pct": feeder_state.get("battery_soc_pct"),
        "recommended_action": feeder_state.get("recommended_action"),
    }
    if feeder_state.get("status") != "UNAVAILABLE":
        sources.append("gridflex-feeder-state")

    active_event = _toolkit.get_active_reliability_event(feeder_id)
    if active_event:
        context["active_event"] = {
            "event_id": active_event.get("event_id"),
            "status": active_event.get("status"),
            "risk_level": active_event.get("risk_level"),
            "predicted_gap_kw": active_event.get("predicted_gap_kw"),
            "duration_minutes": active_event.get("duration_minutes"),
        }
        sources.append("gridflex-reliability-events")

    pool_info = _toolkit.get_flexibility_pool(feeder_id)
    context["flexibility_pool"] = {
        "total_resources": len(pool_info.get("resources", [])),
        "total_available_kw": pool_info.get("total_available_kw", 0),
        "has_sufficient_coverage": pool_info.get("has_sufficient_coverage", False),
    }
    if pool_info.get("resources"):
        sources.append("gridflex-flexibility-pool")

    if event_id:
        try:
            plan_explanation = _toolkit.explain_dispatch_plan(event_id)
            context["dispatch_plan"] = plan_explanation
            sources.append("gridflex-decisions")
        except Exception:
            pass

    answer = _generate_rule_based_answer(question, context)
    return {
        "question": question,
        "answer": answer,
        "context": context,
        "sources": sources,
        "agent": "rule-based-mvp",
        "note": (
            "This is a rule-based explanation agent. In future it will use an LLM "
            "(e.g. Claude via Bedrock Agents) with these same read-only tools."
        ),
    }


def _generate_rule_based_answer(question: str, context: dict) -> str:
    """Simple keyword-driven rule engine for MVP explanations."""
    q = question.lower()
    state = context.get("feeder_state", {})
    active_event = context.get("active_event")
    pool = context.get("flexibility_pool", {})
    plan = context.get("dispatch_plan")

    risk = state.get("risk_level", "LOW")
    stress = state.get("stress_index", 0)
    gap = state.get("net_gap_kw", 0)
    demand = state.get("demand_kw", "?")
    solar = state.get("solar_kw", "?")
    soc = state.get("battery_soc_pct", 80)
    action = state.get("recommended_action", "MONITOR")

    # ── Risk / why ──────────────────────────────────────────────────────────
    if any(k in q for k in ("risk", "why", "danger", "critical", "high")):
        if risk == "CRITICAL":
            return (
                f"Feeder is at CRITICAL risk (stress index: {stress}/100). "
                f"There is a significant energy gap of {gap} kW that threatens reliability. "
                f"Demand is {demand} kW against solar output of {solar} kW. "
                f"Immediate action is required. The system has created a reliability event. "
                f"Recommended action: {action}."
            )
        if risk == "HIGH":
            return (
                f"Feeder is at HIGH risk (stress index: {stress}/100). "
                f"An energy gap of {gap} kW exists between demand ({demand} kW) "
                f"and available supply (solar {solar} kW + grid import limit). "
                f"Critical loads are protected, but non-critical loads may be affected. "
                f"Recommended action: {action}."
            )
        return (
            f"Feeder is at {risk} risk (stress index: {stress}/100). "
            f"Grid conditions are currently stable. Current gap: {gap} kW. "
            f"Normal monitoring is sufficient."
        )

    # ── Reliability event ────────────────────────────────────────────────────
    if any(k in q for k in ("event", "reliability event", "outage", "interruption")):
        if active_event:
            return (
                f"There is an active reliability event ({active_event['event_id']}). "
                f"Status: {active_event['status']}, Risk Level: {active_event['risk_level']}, "
                f"Predicted Gap: {active_event['predicted_gap_kw']} kW, "
                f"Duration: {active_event['duration_minutes']} minutes. "
                f"The flexibility pool has {pool.get('total_available_kw', 0)} kW available. "
                f"Operator approval is required for dispatch."
            )
        return "There are currently no active reliability events. The feeder is operating normally."

    # ── Battery ──────────────────────────────────────────────────────────────
    if any(k in q for k in ("battery", "soc", "charge", "storage")):
        return (
            f"The community battery is currently at {soc}% state of charge. "
            f"GridFlex maintains a 20% reserve floor for emergencies — "
            f"{'the battery has headroom above reserve.' if float(soc) > 25 else 'WARNING: battery is near the reserve floor.'} "
            f"Available capacity is used to cover energy gaps and protect critical loads (48 kW protected)."
        )

    # ── Flexibility pool ─────────────────────────────────────────────────────
    if any(k in q for k in ("flexibility", "pool", "resources", "dr", "demand response", "community")):
        total_res = pool.get("total_resources", 0)
        total_kw = pool.get("total_available_kw", 0)
        coverage = "sufficient" if pool.get("has_sufficient_coverage") else "insufficient"
        return (
            f"The flexibility pool contains {total_res} enrolled community resources "
            f"with a total of {total_kw} kW available. "
            f"Coverage is {coverage} for the current gap ({gap} kW). "
            f"Resources are ranked by Reliability Budget Score (RBS) to minimise community disruption — "
            f"batteries and EVs are dispatched before HVAC and commercial loads."
        )

    # ── Dispatch plan / optimization ─────────────────────────────────────────
    if any(k in q for k in ("dispatch", "plan", "optimization", "optimise", "optimize")):
        if plan and plan.get("explanation"):
            return plan["explanation"]
        if active_event:
            return (
                f"A reliability event ({active_event['event_id']}) is active. "
                f"To view the dispatch plan, POST /api/v1/events/{active_event['event_id']}/optimize first, "
                f"then ask again."
            )
        return (
            "No active dispatch plan. You can run POST /api/v1/optimization/{feeder_id}/run "
            "to generate a new optimization plan. Operator approval is always required."
        )

    # ── Forecast ─────────────────────────────────────────────────────────────
    if any(k in q for k in ("forecast", "predict", "solar", "demand", "cloud")):
        return (
            f"The GridFlex forecast uses a Ridge regression demand model + physics-based solar irradiance model. "
            f"Current demand: {demand} kW, solar output: {solar} kW. "
            f"A cloud event reduces solar output, widening the energy gap. "
            f"POST /api/v1/forecast/{state.get('feeder_id', 'F01')}/refresh to refresh the forecast."
        )

    # ── Simulation / what if ─────────────────────────────────────────────────
    if any(k in q for k in ("simulate", "what if", "scenario", "hypothetical")):
        sim = _toolkit_local_simulate(state)
        return (
            f"Read-only simulation result: {sim.get('explanation', 'No simulation available.')} "
            f"Note: this is a scenario only — no dispatch was approved or executed."
        )

    # ── Default ──────────────────────────────────────────────────────────────
    return (
        f"GridFlex Copilot — current status: feeder is {risk} risk "
        f"(stress {stress}/100, gap {gap} kW, battery {soc}%). "
        f"I can explain: feeder risk, reliability events, battery status, "
        f"flexibility pool, optimization decisions, or forecast conditions. "
        f"Try asking: 'Why is the risk HIGH?' or 'What is in the flexibility pool?'"
    )


def _toolkit_local_simulate(state: dict) -> dict:
    """Run a read-only simulation using the toolkit."""
    try:
        return _toolkit.simulate_optimization(state.get("feeder_id", "F01"))
    except Exception:
        return {}
