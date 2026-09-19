"""GridFlex Copilot — constrained explanation and simulation agent.

Architecture
────────────
User question
    ↓
app/agents/gridflex_copilot/agent.py   (orchestrator)
    ↓
app/agents/gridflex_copilot/tools.py   (read-only tool interface)
    ↓
app/services/*                          (deterministic GridFlex logic)
    ↓
Result → AI explanation

The agent NEVER calls:
• optimization_service.generate_dispatch_plan()  (write)
• reliability_service.approve_event()            (write)
• Any function that changes grid state

It ONLY reads via the CopilotToolkit methods.
"""
