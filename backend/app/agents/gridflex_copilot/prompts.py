"""GridFlex Copilot — system prompt and Bedrock Converse tool specifications.

The tool specs here are passed directly to Bedrock's Converse API as the
``tools`` parameter.  Each tool name must match exactly the names in
permissions.py and tools.py.
"""
from __future__ import annotations

from typing import Any

# ─────────────────────────────────────────────────────────────────────────────
# System Prompt
# ─────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are the GridFlex Reliability Copilot, an AI assistant embedded in a
community-scale smart grid management system for Mumbai, India (MSEDCL distribution network,
Feeder F01 — Dharavi North).

Your role is to EXPLAIN, ANALYSE, and SIMULATE grid conditions for human operators
and community stakeholders.

CAPABILITIES:
- Explain why the grid is under stress or at risk
- Explain reliability events and their causes
- Describe the flexibility pool and available community resources
- Explain optimization decisions and dispatch plans
- Run read-only "what if" scenario simulations
- Compare forecast vs. actual outcomes
- Answer questions about spatial feeder topology

HARD CONSTRAINTS — you MUST NEVER:
- Dispatch resources or issue grid control commands
- Approve decisions or bypass operator sign-off
- Modify safety constraints, battery reserve, or critical-load protections
- Write to any database or telemetry system
- Execute arbitrary code, SQL, or shell commands
- Modify AWS infrastructure

SAFETY CONTEXT:
- Critical loads (48 kW) are ALWAYS protected — never suggest shedding them
- Battery reserve floor (20%) is a hard safety constraint — never suggest bypassing it
- All dispatch actions require operator approval — you cannot approve them

RESPONSE STYLE:
- Be concise and technically precise
- Use actual numbers from the live data (MW, kW, %, minutes)
- When citing data, mention the source tool used
- If data is unavailable, say so clearly — never fabricate values
- For scenario questions, clearly label results as SIMULATION (not live state)
- If Bedrock is reasoning over simulation results, add "⚠️ SIMULATION — not live operational data"

DATA GROUNDING:
Always call the appropriate GridFlex tools to get live data before answering.
Do not answer from memory or general knowledge when live data is available.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Converse Tool Specifications
# These are passed to Bedrock as toolConfig.tools
# ─────────────────────────────────────────────────────────────────────────────

TOOL_SPECS: list[dict[str, Any]] = [
    {
        "toolSpec": {
            "name": "get_current_grid_state",
            "description": (
                "Returns the current grid state for a feeder: demand (kW), solar generation (kW), "
                "energy gap (kW), battery state-of-charge (%), stress index (0-100), risk level "
                "(LOW/MEDIUM/HIGH/CRITICAL), recommended action, and transformer loading. "
                "Use this as the primary diagnostic tool when asked about grid stress, risk, or current conditions."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "feeder_id": {
                            "type": "string",
                            "description": "Feeder ID (e.g. 'F01'). Defaults to F01 if omitted.",
                        }
                    },
                    "required": [],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "get_forecast",
            "description": (
                "Returns the 48-slot (24-hour) demand and solar generation forecast for a feeder. "
                "Each slot is 30 minutes. Use this to explain future energy gaps, upcoming peak periods, "
                "or the impact of cloud events on solar output."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "feeder_id": {
                            "type": "string",
                            "description": "Feeder ID. Defaults to F01.",
                        }
                    },
                    "required": [],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "get_active_reliability_events",
            "description": (
                "Returns all currently active reliability events for a feeder. "
                "An event is active if its status is PREDICTED, ACTIVE, OPERATOR_APPROVED, "
                "DISPATCHED, or VERIFYING. Use this when asked why an event triggered or "
                "what the current event status is."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "feeder_id": {
                            "type": "string",
                            "description": "Feeder ID. Defaults to F01.",
                        }
                    },
                    "required": [],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "get_reliability_event",
            "description": (
                "Returns full detail for a specific reliability event by ID, including "
                "predicted gap, duration, risk level, dispatch plan (if available), "
                "battery reserve after dispatch, and outcome (if verified)."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "event_id": {
                            "type": "string",
                            "description": "Reliability event ID (e.g. 'GF-F01-20260920-1800').",
                        }
                    },
                    "required": ["event_id"],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "get_flexibility_pool",
            "description": (
                "Returns the ranked flexibility pool for a feeder: list of enrolled community "
                "resources (batteries, EV charging, HVAC, water heaters) sorted by Reliability "
                "Budget Score (RBS). Each resource includes available kW, response time, disruption "
                "weight, and owner type. Use this when asked about available flexibility or where "
                "to find additional kW."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "feeder_id": {
                            "type": "string",
                            "description": "Feeder ID. Defaults to F01.",
                        }
                    },
                    "required": [],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "get_spatial_state",
            "description": (
                "Returns the feeder's spatial/topological state: transformer loading percentage, "
                "voltage risk level, section-level load percentages (Section A/B/C), and critical "
                "facility locations. Use this when asked about specific sections, transformer "
                "overloading, or voltage issues."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "feeder_id": {
                            "type": "string",
                            "description": "Feeder ID. Defaults to F01.",
                        }
                    },
                    "required": [],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "get_reliability_metrics",
            "description": (
                "Returns quantified reliability metrics comparing baseline (no GridFlex) vs. "
                "GridFlex-optimized operation: SAIDI, SAIFI, unserved energy (kWh), reliability "
                "gain percentage, critical load uptime, and battery utilization efficiency. "
                "Use this when asked about reliability improvement or SAIDI/SAIFI values."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "feeder_id": {
                            "type": "string",
                            "description": "Feeder ID. Defaults to F01.",
                        }
                    },
                    "required": [],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "simulate_optimization",
            "description": (
                "Runs an IN-MEMORY optimization scenario using the GridFlex LP solver + heuristic "
                "fallback. The result is NOT stored and does NOT affect live grid state. "
                "Returns the dispatch plan (battery kW, load shift kW), expected reliability %, "
                "unserved energy, and policy check results. "
                "Use this for 'what if' questions like 'what if solar drops 20%?' or "
                "'can we handle another 30 kW gap?'. "
                "Always label results as SIMULATION in your answer."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "feeder_id": {
                            "type": "string",
                            "description": "Feeder ID. Defaults to F01.",
                        },
                        "scenario": {
                            "type": "object",
                            "description": (
                                "Optional scenario overrides. Supported keys: "
                                "'solar_reduction_pct' (0-100, reduce solar by this %), "
                                "'demand_increase_pct' (0-100, increase demand by this %), "
                                "'battery_soc_override_pct' (0-100, override battery SoC)."
                            ),
                            "properties": {
                                "solar_reduction_pct": {"type": "number"},
                                "demand_increase_pct": {"type": "number"},
                                "battery_soc_override_pct": {"type": "number"},
                            },
                        },
                    },
                    "required": [],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "explain_dispatch_plan",
            "description": (
                "Returns a structured explanation of an existing dispatch plan for a reliability "
                "event: resources selected, dispatch kW per resource, duration, priority ranking "
                "by Reliability Budget Score, battery reserve after dispatch, and whether operator "
                "approval is pending. Use this when asked 'why did GridFlex choose these resources?'"
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "event_id": {
                            "type": "string",
                            "description": "Reliability event ID.",
                        }
                    },
                    "required": ["event_id"],
                }
            },
        }
    },
    {
        "toolSpec": {
            "name": "compare_forecast_actual",
            "description": (
                "For a completed/verified reliability event, compares the planned dispatch "
                "vs. actual telemetry outcomes: compliance per resource, actual vs. planned kW, "
                "unserved energy, SAIDI impact, and community reliability score."
            ),
            "inputSchema": {
                "json": {
                    "type": "object",
                    "properties": {
                        "event_id": {
                            "type": "string",
                            "description": "Reliability event ID.",
                        }
                    },
                    "required": ["event_id"],
                }
            },
        }
    },
]

# Quick reference: map of tool name → spec index for validation
TOOL_NAMES: frozenset[str] = frozenset(
    spec["toolSpec"]["name"] for spec in TOOL_SPECS
)


def build_tool_config(use_any: bool = False) -> dict:
    """Build the Converse API toolConfig dict."""
    return {
        "tools": TOOL_SPECS,
        "toolChoice": {"auto": {}} if use_any else {"auto": {}},
    }
