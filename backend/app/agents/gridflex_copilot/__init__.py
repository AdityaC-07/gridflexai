"""GridFlex Reliability Copilot — Amazon Bedrock agentic layer.

Architecture
────────────
User question
    ↓
POST /api/v1/copilot/query          (api/copilot.py)
    ↓
run_copilot_query()                 (agent.py)
    ↓
Amazon Bedrock Converse API         (bedrock.py)
    ↓  toolUse
Permission check                    (permissions.py)
    ↓  ALLOWED
GridFlex tool execution             (tools.py)
    ↓  reads existing services:
        app.core.store
        app.services.grid_intelligence
        app.services.forecast
        app.services.optimization
        app.services.reliability
        app.services.flexibility
    ↓  toolResult
Amazon Bedrock Converse API         (bedrock.py)
    ↓  end_turn
Natural-language answer
    ↓
CopilotQueryResponse                (schemas.py)

Safety guarantee
────────────────
The permission layer (permissions.py) enforces READ-ONLY / SIMULATE-ONLY access.
No tool can write, dispatch, approve, or modify safety thresholds.
"""
from app.agents.gridflex_copilot.agent import run_copilot_query
from app.agents.gridflex_copilot.schemas import CopilotQueryRequest, CopilotQueryResponse

__all__ = ["run_copilot_query", "CopilotQueryRequest", "CopilotQueryResponse"]
