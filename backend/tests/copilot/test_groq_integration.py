"""Groq integration smoke test.

This test attempts REAL Groq inference.
It is skipped automatically if:
  - GROQ_API_KEY is not configured
  - GROQ_ENABLED env var is 'false'
  - pytest marker 'integration' is not selected

Run with:
    pytest tests/copilot/test_groq_integration.py -v -m integration

Or with env vars:
    GROQ_ENABLED=true GROQ_API_KEY=gsk_... pytest tests/copilot/test_groq_integration.py -v -m integration
"""
import os
import time

import pytest


def _groq_reachable() -> bool:
    """Return True if a Groq API key is available and GROQ_ENABLED is not 'false'."""
    if os.getenv("GROQ_ENABLED", "true").lower() == "false":
        return False
    return bool(os.getenv("GROQ_API_KEY"))


pytestmark = [
    pytest.mark.integration,
    pytest.mark.skipif(
        not _groq_reachable(),
        reason="Groq not reachable — set GROQ_API_KEY to run integration tests",
    ),
]


@pytest.fixture(scope="module")
def groq_client():
    """Create a real Groq client for integration tests."""
    if not _groq_reachable():
        pytest.skip("Groq not reachable — set GROQ_API_KEY to run integration tests")
    from app.agents.gridflex_copilot.llm import _get_client, reset_client
    reset_client()
    client = _get_client()
    if client is None:
        pytest.skip("Groq client could not be initialised")
    return client


@pytest.fixture(scope="module")
def model_id():
    return os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


# ─────────────────────────────────────────────────────────────────────────────
# Smoke test 1: API key is available
# ─────────────────────────────────────────────────────────────────────────────

def test_api_key_available_integration():
    """Verify a Groq API key can be resolved."""
    from app.agents.gridflex_copilot.llm import api_key_available
    result = api_key_available()
    print(f"\n[Integration] api_key_available={result}")
    if not result:
        pytest.skip("No GROQ_API_KEY — skipping integration tests")
    assert result is True


# ─────────────────────────────────────────────────────────────────────────────
# Smoke test 2: Groq client can be created
# ─────────────────────────────────────────────────────────────────────────────

def test_groq_client_creation(groq_client):
    """Verify the Groq client object was created."""
    assert groq_client is not None
    print(f"\n[Integration] Groq client type: {type(groq_client).__name__}")


# ─────────────────────────────────────────────────────────────────────────────
# Smoke test 3: chat completion call succeeds
# ─────────────────────────────────────────────────────────────────────────────

def test_chat_completion_succeeds(model_id):
    """Make a real chat completion call and verify it returns text."""
    from app.agents.gridflex_copilot.llm import converse, extract_text, stop_reason

    t0 = time.monotonic()
    response = converse(
        messages=[{
            "role": "user",
            "content": [{"text": "Reply with exactly: GRIDFLEX_OK"}],
        }],
        system_prompt="You are a test assistant. Follow instructions exactly.",
        max_tokens=20,
        temperature=0.0,
    )
    latency_ms = round((time.monotonic() - t0) * 1000, 1)

    sr = stop_reason(response)
    text = extract_text(response)

    print(f"\n[Integration] Model: {model_id}")
    print(f"[Integration] Stop reason: {sr}")
    print(f"[Integration] Response text: {text!r}")
    print(f"[Integration] Latency: {latency_ms} ms")

    assert sr == "end_turn", f"Expected end_turn, got {sr}"
    assert isinstance(text, str), "Response text must be a string"
    assert len(text) > 0, "Response text must not be empty"


# ─────────────────────────────────────────────────────────────────────────────
# Smoke test 4: Tool-use works with a single tool
# ─────────────────────────────────────────────────────────────────────────────

def test_tool_use_round_trip(model_id):
    """Verify that Groq can request a tool and process the result."""
    from app.agents.gridflex_copilot.llm import (
        converse, extract_tool_uses, stop_reason,
        build_tool_result_message, build_assistant_tool_use_message,
        extract_text,
    )
    from app.agents.gridflex_copilot.prompts import TOOL_SPECS, build_tool_config

    # Only pass one simple tool to reduce complexity
    single_tool_config = {
        "tools": [TOOL_SPECS[0]],  # get_current_grid_state
        "toolChoice": {"auto": {}},
    }

    messages = [{
        "role": "user",
        "content": [{"text": "What is the current feeder risk level? Use the get_current_grid_state tool."}],
    }]

    response = converse(
        messages=messages,
        system_prompt="You are GridFlex Copilot. Use the tools to answer.",
        tool_config=single_tool_config,
        max_tokens=400,
    )

    sr = stop_reason(response)
    print(f"\n[Integration] Initial stop reason: {sr}")

    if sr == "tool_use":
        tool_uses = extract_tool_uses(response)
        print(f"[Integration] Tools requested: {[t['name'] for t in tool_uses]}")

        # Append assistant message
        messages.append(build_assistant_tool_use_message(response))

        # Provide a mock tool result
        for tu in tool_uses:
            fake_result = {
                "risk_level": "LOW",
                "stress_index": 12.4,
                "demand_kw": 162.0,
                "solar_kw": 118.0,
                "net_gap_kw": 0.0,
                "feeder_id": "F01",
            }
            messages.append(build_tool_result_message(tu["toolUseId"], fake_result))

        # Second chat completion call
        response2 = converse(
            messages=messages,
            system_prompt="You are GridFlex Copilot. Use the tools to answer.",
            tool_config=single_tool_config,
            max_tokens=400,
        )

        sr2 = stop_reason(response2)
        text = extract_text(response2)
        print(f"[Integration] Final stop reason: {sr2}")
        print(f"[Integration] Final text: {text[:200]!r}")

        assert sr2 == "end_turn"
        assert len(text) > 0
    elif sr == "end_turn":
        # Some models answer directly without tool use
        text = extract_text(response)
        print(f"[Integration] Direct answer (no tool use): {text[:200]!r}")
        assert len(text) > 0
    else:
        pytest.fail(f"Unexpected stop reason: {sr}")


# ─────────────────────────────────────────────────────────────────────────────
# Smoke test 5: Full Copilot query pipeline
# ─────────────────────────────────────────────────────────────────────────────

def test_full_copilot_query_pipeline():
    """Run a complete Copilot query with real Groq and real GridFlex tools."""
    from importlib import reload

    old_enabled = os.environ.get("GROQ_ENABLED")
    os.environ["GROQ_ENABLED"] = "true"

    import app.config as cfg_mod
    reload(cfg_mod)
    import app.agents.gridflex_copilot.llm as llm_mod
    reload(llm_mod)
    import app.agents.gridflex_copilot.agent as agent_mod
    reload(agent_mod)

    from app.agents.gridflex_copilot.schemas import CopilotQueryRequest
    from app.agents.gridflex_copilot.agent import run_copilot_query

    req = CopilotQueryRequest(
        message="What is the current feeder risk level and stress index?",
        feeder_id="F01",
    )

    try:
        t0 = time.monotonic()
        result = run_copilot_query(req)
        latency = round((time.monotonic() - t0) * 1000, 1)

        print(f"\n[Integration] === Full Pipeline Result ===")
        print(f"  Model:     {result.model}")
        print(f"  Provider:  {result.provider}")
        print(f"  Mode:      {result.mode}")
        print(f"  Tools:     {[t.tool_name for t in result.tools_used]}")
        print(f"  Sources:   {result.sources}")
        print(f"  Latency:   {latency} ms")
        print(f"  Answer:    {result.answer[:300]!r}")

        assert isinstance(result.answer, str) and len(result.answer) > 10
        assert result.model
        assert result.provider == "Groq"
        assert result.mode in ("live", "fallback")
    finally:
        if old_enabled is not None:
            os.environ["GROQ_ENABLED"] = old_enabled
        else:
            os.environ.pop("GROQ_ENABLED", None)
        reload(cfg_mod)
        reload(llm_mod)
        reload(agent_mod)
