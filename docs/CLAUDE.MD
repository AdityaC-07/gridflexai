# GridFlex AI — Engineering Reference

> **Last updated:** Sprint 4 — Amazon Bedrock Copilot AI Layer  
> This document reflects the cumulative state of all implemented work.  
> It is the authoritative reference for any developer picking up this codebase.

---

## Table of Contents

1. [How to Run Locally](#1-how-to-run-locally)
2. [Repository Structure](#2-repository-structure)
3. [Architecture](#3-architecture)
4. [Backend — Unified FastAPI App](#4-backend--unified-fastapi-app)
5. [Environment Variables](#5-environment-variables)
6. [All API Routes](#6-all-api-routes)
7. [Frontend](#7-frontend)
8. [Amazon Bedrock Copilot AI Layer](#8-amazon-bedrock-copilot-ai-layer)
9. [Data & Storage](#9-data--storage)
10. [Test Suite](#10-test-suite)
11. [Production AWS Architecture](#11-production-aws-architecture)
12. [Known Technical Debt](#12-known-technical-debt)

---

## 1. How to Run Locally

### Backend (ONE command, ONE terminal)

```bash
cd backend

# First time only
cp .env.example .env          # defaults are fine for local dev

pip install -r requirements.txt

uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (interactive Swagger UI)
```

No Docker. No DynamoDB. No AWS credentials required for `APP_MODE=local`.

### Frontend

```bash
cd frontend

npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api/*` and `/simulation/*` to `localhost:8000` — no CORS issues.

### To enable the Bedrock Copilot

```bash
# In backend/.env:
BEDROCK_ENABLED=true
BEDROCK_MODEL_ID=amazon.nova-lite-v1:0
AWS_REGION=ap-south-1

# Plus AWS credentials via one of:
#   export AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=...
#   aws configure
#   IAM role (ECS/EC2 in production — no env vars needed)
```

---

## 2. Repository Structure

```
gridflexai/
├── backend/
│   ├── app/                          ← Unified FastAPI application (Sprint 1)
│   │   ├── main.py                   ← Single entrypoint: uvicorn app.main:app
│   │   ├── config.py                 ← All config (APP_MODE, Bedrock, grid params)
│   │   ├── core/
│   │   │   ├── store.py              ← Storage abstraction: local dict ↔ DynamoDB
│   │   │   └── local_dynamo_patch.py ← Monkey-patches shared.dynamo in local mode
│   │   ├── api/                      ← FastAPI routers (one per domain)
│   │   │   ├── telemetry.py
│   │   │   ├── forecast.py
│   │   │   ├── grid.py
│   │   │   ├── optimization.py
│   │   │   ├── reliability.py
│   │   │   ├── events.py
│   │   │   ├── flexibility.py
│   │   │   ├── copilot.py            ← /query + /status + /ask (legacy)
│   │   │   └── simulation.py         ← legacy /simulation/* paths
│   │   ├── services/                 ← Pure Python service wrappers
│   │   │   ├── forecast/
│   │   │   ├── grid_intelligence/
│   │   │   ├── optimization/
│   │   │   ├── reliability/
│   │   │   ├── flexibility/
│   │   │   └── event_detection/
│   │   └── agents/
│   │       └── gridflex_copilot/     ← Amazon Bedrock AI layer (Sprint 4)
│   │           ├── __init__.py
│   │           ├── agent.py          ← Converse agentic loop
│   │           ├── bedrock.py        ← boto3 Bedrock Runtime client
│   │           ├── prompts.py        ← System prompt + 10 Converse tool specs
│   │           ├── tools.py          ← 10 real GridFlex tool implementations
│   │           ├── permissions.py    ← Allowlist/denylist security layer
│   │           └── schemas.py        ← Pydantic request/response models
│   ├── forecast_service/             ← Original per-service code (unchanged)
│   ├── grid_intelligence/
│   ├── optimization_service/
│   ├── verification_service/
│   ├── copilot_service/              ← Old rule-based copilot (superseded)
│   ├── data_api/                     ← Old API gateway (superseded by app/)
│   ├── shared/                       ← DynamoDB helpers + config + models
│   ├── infra/                        ← ECS task definitions, IAM, EventBridge
│   ├── mock_data/                    ← JSON fixtures for offline dev
│   ├── tests/
│   │   ├── test_demand_model.py
│   │   ├── test_gap_calculator.py
│   │   ├── test_optimizer.py
│   │   ├── test_policy_layer.py
│   │   ├── test_reliability.py
│   │   ├── test_solar_model.py
│   │   ├── test_reliability_event_schema.py
│   │   └── copilot/
│   │       ├── test_permissions.py          ← 22 permission security tests
│   │       ├── test_bedrock_client.py       ← 22 mocked Bedrock client tests
│   │       ├── test_agent_loop.py           ← 7 mocked agent loop tests
│   │       └── test_bedrock_integration.py  ← 5 real Bedrock smoke tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                   ← Router: 11 routes, all pages wired
│   │   ├── config.js                 ← API base URL (uses Vite proxy)
│   │   ├── api/                      ← Axios client + per-domain API functions
│   │   ├── context/
│   │   │   ├── BuildingContext.jsx   ← Theme, 6 Mumbai buildings, retrofits
│   │   │   └── GridStateContext.jsx  ← Live grid state, polling, cloud events
│   │   ├── pages/                    ← 11 pages (all routed)
│   │   │   ├── LandingPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── BuildingDetailsPage.jsx   ← Feeder dropdown (6 zones)
│   │   │   ├── GridOpsPage.jsx
│   │   │   ├── RetrofitsPage.jsx
│   │   │   ├── EquipmentPage.jsx
│   │   │   ├── OperatorDashboard.jsx     ← Includes CopilotPanel
│   │   │   ├── SimulationPage.jsx
│   │   │   ├── ReliabilityPage.jsx
│   │   │   ├── DiscomDashboard.jsx
│   │   │   └── ResidentView.jsx
│   │   └── components/
│   │       ├── copilot/
│   │       │   └── CopilotPanel.jsx      ← Amazon Bedrock UI (Sprint 4)
│   │       ├── cards/
│   │       ├── charts/
│   │       ├── layout/
│   │       ├── optimization/
│   │       ├── alerts/
│   │       └── modals/
│   ├── vite.config.js                ← Proxy: /api/* → :8000
│   └── .env                          ← VITE_API_URL="" (uses proxy)
└── docs/
    └── CLAUDE.md                     ← This file
```

---

## 3. Architecture

### Local development (current)

```
Browser (localhost:5173)
    ↓  Vite proxy
FastAPI unified backend (localhost:8000)
    ↓
app/core/store.py  ← in-memory Python dicts (no DynamoDB)
    ↓
existing service modules (forecast_service/, grid_intelligence/, etc.)
    ↓
GridFlex Copilot (BEDROCK_ENABLED=true)
    ↓
Amazon Bedrock Converse API (ap-south-1)
    ↓  toolUse / toolResult loop
10 read-only GridFlex tools
```

### Data flow — single request lifecycle

```
1. Frontend calls GET /api/v1/feeder/F01/state
2. Vite proxy forwards to http://localhost:8000/api/v1/feeder/F01/state
3. app/api/grid.py router handles it
4. Checks app/core/store.get_latest_feeder_state("F01")
5. If stale/missing → calls app/services/grid_intelligence.evaluate_feeder_state()
6. Which calls grid_intelligence/main.run_intelligence_cycle() (unchanged original)
7. Result written back to in-memory store
8. Response returned to frontend
```

### Theme system

`BuildingContext.jsx` sets `document.documentElement.setAttribute('data-theme', ...)` on every theme toggle. Both CSS variable systems (`design-tokens.css` with `[data-theme="light"]` and `tokens.css` with default-dark / `[data-theme="light"]` override) respond automatically. Every component that uses `var(--bg-surface)`, `var(--text-primary)`, etc. flips without per-component `isLight` logic.

---

## 4. Backend — Unified FastAPI App

### Entry point

```
backend/app/main.py
```

Start with: `uvicorn app.main:app --reload`

### Startup sequence

1. Load `.env` via `python-dotenv`
2. Read `AppConfig` from env vars
3. If `APP_MODE=local`: apply `local_dynamo_patch` — replaces all `shared.dynamo` functions with in-memory equivalents
4. Import all routers
5. Lifespan handler: warm forecast model (Ridge regression from `training_data.csv`)
6. Serve on port 8000

### APP_MODE

| Value | Store | DynamoDB | AWS creds |
|---|---|---|---|
| `local` (default) | In-memory Python dicts | Never contacted | Not required |
| `aws` | DynamoDB primary | Always used | Required |

### CORS

Explicit allowlist (not `"*"`):
- `http://localhost:5173` (Vite dev)
- `http://localhost:5174`
- `http://localhost:3000`
- `http://localhost:8000`
- `http://127.0.0.1:5173`

Add production domain to `_ALLOWED_ORIGINS` in `app/main.py` when deploying.

### Telemetry cold-start fix

`GET /api/v1/feeder/{id}/telemetry/current` previously returned 404 on cold start because nothing had ingested telemetry. Now it synthesizes a reading from the latest feeder state (tagged `"source": "synthesized"`) and persists it, so subsequent reads hit the store fast.

---

## 5. Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Notes |
|---|---|---|
| `APP_MODE` | `local` | `local` or `aws` |
| `AWS_REGION` | `ap-south-1` | Used by DynamoDB + Bedrock |
| `AWS_ENDPOINT_URL` | `` | Set to LocalStack URL for local DynamoDB |
| `DYNAMODB_TABLE_PREFIX` | `gridflex` | Prefix for all table names |
| `FEEDER_ID` | `F01` | Default feeder |
| `GRID_IMPORT_LIMIT` | `80` | kW |
| `BATTERY_CAPACITY_KWH` | `200` | kWh |
| `BATTERY_RESERVE_PCT` | `20` | % floor, safety constraint |
| `BATTERY_MAX_DISCHARGE_KW` | `75` | kW |
| `BATTERY_MAX_CHARGE_KW` | `50` | kW |
| `CRITICAL_LOAD_KW` | `48` | kW, never shed |
| `PEAK_SOLAR_KW` | `150` | kW peak capacity |
| `SNS_ENABLED` | `false` | Enable SNS alerts |
| `SNS_TOPIC_ARN` | `` | ARN of SNS topic |
| `BEDROCK_ENABLED` | `false` | `true` to activate AI Copilot |
| `BEDROCK_MODEL_ID` | `amazon.nova-lite-v1:0` | See model guide below |
| `BEDROCK_MAX_TOKENS` | `1000` | Max tokens per response |
| `BEDROCK_TEMPERATURE` | `0.2` | 0.0 = deterministic, 1.0 = creative |
| `BEDROCK_GUARDRAIL_ID` | `` | Optional Bedrock Guardrail ID |
| `BEDROCK_GUARDRAIL_VERSION` | `` | Optional Guardrail version |

**Bedrock model guide (ap-south-1):**

| Model ID | Speed | Cost | Notes |
|---|---|---|---|
| `amazon.nova-lite-v1:0` | Fast | Low | **Default** — tool use, good for Q&A |
| `amazon.nova-pro-v1:0` | Medium | Medium | Higher capability |
| `anthropic.claude-3-haiku-20240307-v1:0` | Fast | Low | Claude Haiku, if enabled in account |

### Frontend (`frontend/.env`)

| Variable | Default | Notes |
|---|---|---|
| `VITE_API_URL` | `` (empty) | Empty = use Vite proxy. Set to `http://localhost:8000` to bypass proxy |
| `VITE_USE_MOCK` | `false` | `true` = always return mock data |

---

## 6. All API Routes

### Core grid endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check with per-service status, mode, feeder |
| `GET` | `/api/v1/feeders` | List all known feeder IDs |
| `GET` | `/api/v1/feeder/{id}/state` | Live feeder state: risk, gap, stress, battery, transformer |
| `GET` | `/api/v1/feeder/{id}/telemetry/current` | Latest telemetry (synthesized from state if no ingest) |
| `GET` | `/api/v1/feeder/{id}/telemetry/history?hours=6` | Telemetry history (0.5–168h) |
| `POST` | `/api/v1/telemetry/{id}/ingest` | Ingest a raw telemetry reading |
| `GET` | `/api/v1/forecast/{id}` | Latest 48-slot demand + solar forecast |
| `POST` | `/api/v1/forecast/{id}/refresh` | Trigger forecast cycle (seeds backend state) |
| `GET` | `/api/v1/optimization/{id}/latest` | Latest optimization decision |
| `POST` | `/api/v1/optimization/{id}/run` | Run LP optimization cycle |
| `POST` | `/api/v1/optimization/{decision_id}/approve` | Operator approval (manual gate, always required) |
| `GET` | `/api/v1/reliability/{id}/metrics` | Baseline vs GridFlex SAIDI/SAIFI metrics |
| `GET` | `/api/v1/alerts/{id}` | Derived alerts from feeder state |
| `GET` | `/api/v1/events` | List reliability events (`?feeder_id=&active_only=`) |
| `GET` | `/api/v1/events/{event_id}` | Single event detail |
| `POST` | `/api/v1/events/{event_id}/approve` | Approve event for dispatch |
| `POST` | `/api/v1/events/{event_id}/optimize` | Run reliability budget optimization (in-process, no HTTP) |
| `POST` | `/api/v1/events/simulate` | Full in-process reliability pipeline (local dev) |
| `GET` | `/api/v1/pool?feeder_id=F01` | Ranked flexibility pool |

### Copilot AI endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/copilot/query` | Submit question to Bedrock Copilot (primary endpoint) |
| `GET` | `/api/v1/copilot/status` | Bedrock availability + config (no credentials exposed) |
| `POST` | `/api/v1/copilot/ask` | Legacy endpoint (backward-compatible, delegates to /query) |

### Simulation (legacy unversioned paths)

| Method | Path | Description |
|---|---|---|
| `POST` | `/simulation/event` | Inject cloud event + refresh forecast |
| `GET` | `/simulation/status` | Current simulation state |
| `POST` | `/simulation/reset` | Clear cloud event, restore baseline |

---

## 7. Frontend

### Pages and routes

| Route | Page | Key data sources |
|---|---|---|
| `/` | `LandingPage` | Static |
| `/dashboard` | `DashboardPage` | `BuildingContext.buildings` (live F01 + static) |
| `/buildings/:id` | `BuildingDetailsPage` | `FEEDER_DETAILS` const + `BuildingContext` |
| `/analytics` | `GridOpsPage` | `feederState.battery_soc_pct`, `total_flexible_kw` |
| `/retrofits` | `RetrofitsPage` | `BuildingContext.retrofits` (computed KPIs) |
| `/equipment` | `EquipmentPage` | `BuildingContext.anomalies` |
| `/operator` | `OperatorDashboard` | `GridStateContext` + `CopilotPanel` |
| `/simulation` | `SimulationPage` | `GridStateContext.triggerCloudEvent` |
| `/reliability` | `ReliabilityPage` | `/api/v1/reliability/F01/metrics` |
| `/discom` | `DiscomDashboard` | `/api/v1/reliability` + `/api/v1/feeders` |
| `/resident` | `ResidentView` | `/api/v1/events?active_only=true` |

### Buildings data — Mumbai feeders

All six building cards represent real MSEDCL distribution feeders in Mumbai:

| ID | Feeder | Location | Category |
|---|---|---|---|
| `dharavi-north-f01` | F01 | Dharavi, Central Mumbai | Residential |
| `kurla-west-f02` | F02 | Kurla West, Eastern Suburbs | Mixed-use |
| `bandra-east-f03` | F03 | BKC Financial District | Commercial |
| `sion-south-f04` | F04 | Sion, Central Line Corridor | Industrial |
| `andheri-east-f05` | F05 | MIDC, Andheri East | Tech Campus |
| `worli-north-f06` | F06 | Worli Sea Face, South Mumbai | Transit + Commercial |

F01 (Dharavi North) is the live instrumented feeder. The rest are illustrative data.

### BuildingDetailsPage — per-feeder data

A `FEEDER_DETAILS` constant at the top of `BuildingDetailsPage.jsx` holds independent energy charts, equipment inventories, anomaly logs, subsystem health, and profile metadata for all six feeders. Selecting a feeder from the dropdown changes all displayed content. The 7/30/90-day chart timeframe buttons generate different data slices (7-day = raw, 30-day = simulated daily, 90-day = weekly aggregates).

### Button accountability

Every visible button in the application has a functional handler:

- **Topbar**: Portfolio → `/dashboard`, Bell → notification panel, Settings → settings panel, Avatar → `/operator`
- **Dashboard**: Filter Zone → activates city tabs, Analytics → `/analytics`, Grid Operator → `/operator`
- **GridOps**: Export CSV → downloads DR settlement data, BESS buttons → navigate to `/reliability` or `/simulation`
- **Retrofits**: Export Plan → downloads capital plan CSV, Simulate Impact → `/simulation`, all 3 floating panel buttons functional
- **BuildingDetails**: Equipment actions route to appropriate tabs, "Download Report" exports telemetry CSV
- **AnalysisCompleteModal**: Download Report → exports analysis CSV with computed retrofit values

---

## 8. Amazon Bedrock Copilot AI Layer

### Overview

The GridFlex Reliability Copilot is a **constrained, read-only AI reasoning layer** that sits above the deterministic GridFlex services. It uses Amazon Bedrock's Converse API with tool use to gather live data and generate grounded natural-language answers.

```
User question
    ↓
POST /api/v1/copilot/query          (api/copilot.py)
    ↓
run_copilot_query()                 (agent.py)
    ↓
Amazon Bedrock Converse API         (bedrock.py)
    ↓  toolUse request
Permission check                    (permissions.py)  ← security gate
    ↓  ALLOWED only
Tool execution                      (tools.py)        ← reads existing services
    ↓  toolResult
Amazon Bedrock Converse API         (bedrock.py)      ← continues conversation
    ↓  end_turn
CopilotQueryResponse                (schemas.py)      ← answer + metadata
```

### The 10 Copilot tools

All tools are **read-only** or **simulate-only** (in-memory, not persisted):

| Tool | What it reads |
|---|---|
| `get_current_grid_state` | Latest feeder state (risk, gap, stress, battery) |
| `get_forecast` | 48-slot demand + solar forecast with gap series |
| `get_active_reliability_events` | All active events for feeder |
| `get_reliability_event` | Full single-event detail |
| `get_flexibility_pool` | Ranked community resources by Reliability Budget Score |
| `get_spatial_state` | Transformer loading, voltage risk, section topology |
| `get_reliability_metrics` | Baseline vs GridFlex SAIDI/SAIFI metrics |
| `simulate_optimization` | LP optimization scenario (in-memory only, never stored) |
| `explain_dispatch_plan` | Resource selection rationale for a dispatch plan |
| `compare_forecast_actual` | Planned vs actual compliance for completed events |

### Permission layer

`permissions.py` enforces an allowlist. Any tool not in the allowlist is blocked before execution. Tests prove that all prohibited operations raise `CopilotPermissionError`:

**Explicitly prohibited (non-exhaustive):**

| Category | Examples |
|---|---|
| Dispatch / approval | `dispatch`, `approve_decision`, `execute_dispatch_plan` |
| Safety policy | `modify_battery_reserve`, `disable_critical_load_protection` |
| Telemetry mutation | `write_telemetry`, `ingest_telemetry` |
| Infrastructure | `create_dynamodb_table`, `put_dynamodb_item` |
| Generic dangerous | `execute_code`, `run_sql`, `shell_exec` |

### Graceful degradation

When `BEDROCK_ENABLED=false` or AWS credentials are unavailable, the Copilot returns a **deterministic answer** from live GridFlex data — it never fabricates an AI response. The response is clearly labelled `"mode": "fallback"` and the `provider` field reads `"Amazon Bedrock (unavailable — deterministic fallback)"`.

### Bedrock Guardrails (optional)

Set `BEDROCK_GUARDRAIL_ID` and `BEDROCK_GUARDRAIL_VERSION` in `.env` to attach a Bedrock Guardrail to every Converse call. Not required for local development.

### Frontend Copilot panel

`CopilotPanel.jsx` is mounted at the bottom of the Operator Dashboard (`/operator`):

- Header shows `GRIDFLEX RELIABILITY COPILOT` · `Powered by Amazon Bedrock`
- Live mode indicator: `LIVE — Bedrock AI` (green) or `FALLBACK — Deterministic` (amber)
- Model ID and region shown in status strip
- Response tagged with `✦ AI RESPONSE`, `DETERMINISTIC DATA`, or `SIMULATION` badge
- Collapsible list of tools invoked per query
- Data sources and response timestamp
- Latency in milliseconds
- 6 preset quick-question buttons
- Loading state: "GRIDFLEX IS REASONING OVER LIVE GRID DATA…"
- Error state: "Bedrock is unavailable. All deterministic GridFlex services remain fully operational."

### API contracts

**POST /api/v1/copilot/query**

Request:
```json
{
  "message": "Why is the grid under stress?",
  "feeder_id": "F01",
  "event_id": null,
  "context": {}
}
```

Response:
```json
{
  "answer": "Feeder F01 is at MEDIUM risk (stress index 25/100)...",
  "model": "amazon.nova-lite-v1:0",
  "provider": "Amazon Bedrock",
  "tools_used": [
    {
      "tool_name": "get_current_grid_state",
      "tool_use_id": "tu-abc123",
      "input_args": {"feeder_id": "F01"},
      "result_summary": "risk=MEDIUM gap=0.0kW soc=80.0%"
    }
  ],
  "sources": ["grid_state", "forecast"],
  "data_timestamp": "2026-09-20T18:02:31+00:00",
  "mode": "live",
  "latency_ms": 342.5,
  "feeder_id": "F01",
  "event_id": null
}
```

**GET /api/v1/copilot/status**

Response:
```json
{
  "enabled": true,
  "provider": "Amazon Bedrock",
  "model": "amazon.nova-lite-v1:0",
  "region": "ap-south-1",
  "credentials_available": true,
  "guardrail_configured": false
}
```

---

## 9. Data & Storage

### Local mode (APP_MODE=local)

All data lives in thread-safe in-memory Python dicts in `app/core/store.py`. State resets on process restart — by design for local dev.

The `local_dynamo_patch` in `app/core/local_dynamo_patch.py` monkey-patches `shared.dynamo` at startup so all original service modules (forecast_service, grid_intelligence, etc.) transparently write to and read from the same in-memory store. No code changes to the existing service modules.

### DynamoDB tables (APP_MODE=aws)

| Table | Hash key | Range key | Usage |
|---|---|---|---|
| `gridflex-telemetry` | `feeder_id` | `timestamp` | Raw telemetry readings |
| `gridflex-forecasts` | `feeder_id` | `timestamp` | 48-slot forecasts |
| `gridflex-feeder-state` | `feeder_id` | `timestamp` | Computed intelligence cycle results |
| `gridflex-decisions` | `feeder_id` | `decision_id` | Optimization decisions |
| `gridflex-battery` | `feeder_id` | — | Battery state |
| `gridflex-reliability-events` | `event_id` | — | Full event lifecycle |
| `gridflex-flexibility-pool` | `resource_id` | — | Enrolled community resources |

### Mock data

`backend/mock_data/` contains JSON fixtures used by the frontend's `fetchWithMockFallback` when the API is unreachable. All fixtures reflect Mumbai/MSEDCL context (Dharavi North, feeder F01).

### Reliability event lifecycle

```
Telemetry → Forecast → Risk Detection → PREDICTED event
    → Operator approves → OPERATOR_APPROVED
    → Reliability budget optimization runs → dispatch plan attached
    → Dispatch → DISPATCHED
    → Verification → VERIFIED (simulated 85–98% compliance)
    → CLOSED
```

---

## 10. Test Suite

### Running tests

```bash
cd backend

# Unit tests (no AWS credentials required)
pytest tests/ --ignore=tests/copilot/test_bedrock_integration.py -v

# Integration smoke tests (requires BEDROCK_ENABLED=true + AWS credentials)
pytest tests/copilot/test_bedrock_integration.py -v -m integration

# Frontend build check
cd ../frontend && npm run build
```

### Test counts by suite

| Suite | File | Tests | Result |
|---|---|---|---|
| Demand model | `test_demand_model.py` | 5 | ✅ pass |
| Gap calculator & risk | `test_gap_calculator.py` | 8 | ✅ pass |
| LP optimizer + heuristic | `test_optimizer.py` | 6 | ✅ pass |
| Policy layer | `test_policy_layer.py` | 6 | ✅ pass |
| Reliability metrics | `test_reliability.py` | 5 | ✅ pass |
| Reliability event schema | `test_reliability_event_schema.py` | 5 | ✅ pass (added Sprint 2) |
| Solar model | `test_solar_model.py` | 6 | ✅ pass |
| Copilot permissions | `copilot/test_permissions.py` | 22 | ✅ pass (added Sprint 4) |
| Bedrock client (mocked) | `copilot/test_bedrock_client.py` | 22 | ✅ pass (added Sprint 4) |
| Agent loop (mocked) | `copilot/test_agent_loop.py` | 7 | ✅ pass (added Sprint 4) |
| Bedrock integration | `copilot/test_bedrock_integration.py` | 5 | ⏸️ skip (no creds) |
| **Total (unit)** | | **101** | **101/101** |

### API smoke tests (separate script)

`tests/copilot/test_bedrock_integration.py` — when run with real credentials:
1. AWS credentials are available
2. Bedrock client can be created
3. Converse call succeeds and returns text
4. Tool-use round-trip works
5. Full Copilot query pipeline returns a grounded answer

---

## 11. Production AWS Architecture

**No changes were made to production infrastructure.** Every Dockerfile, ECS task definition, docker-compose.yml, IAM policy, EventBridge rule, and infra script is unchanged.

```
Production (ECS/Fargate, ap-south-1):
  Port 8000: data_api/          ECR image
  Port 8001: forecast_service/  ECR image
  Port 8002: grid_intelligence/ ECR image
  Port 8003: optimization_service/ ECR image
  Port 8005: verification_service/ ECR image
  Port 8006: copilot_service/   ECR image (old rule-based)
  Store:     DynamoDB (7 tables, PAY_PER_REQUEST)
  Alerts:    SNS (when SNS_ENABLED=true)
```

The unified `app/` directory can be deployed as a single ECS task replacing all six containers when the team is ready — the business logic is identical, only the process boundary changes.

To add the Bedrock Copilot to production:
1. Attach `bedrock:InvokeModel` permission to the ECS task IAM role
2. Set `BEDROCK_ENABLED=true` in the ECS task environment
3. No other infrastructure changes required

---

## 12. Known Technical Debt

### Active

1. **Flexibility pool empty in local mode** — The in-memory store starts with no enrolled resources. Run `infra/seed_flexibility_pool.py` against DynamoDB in `aws` mode, or add a startup seed function to `FlexibilityService` for local dev.

2. **No scheduled intelligence/forecast cycles in local mode** — `forecast_service/scheduler.py` and `grid_intelligence/scheduler.py` exist but are never invoked. Intelligence cycles only run on-demand via HTTP. Add an `APScheduler` job in `app/main.py`'s `lifespan()` to run automatically every N minutes.

3. **`verification_service` uses `random.uniform`** — `verification_service/main.py:57` uses unseeded random for simulated compliance (MVP placeholder). Production needs real smart-meter data from the grid.

4. **`data_api/write_handlers.py` localhost:8003 call** — The old `data_api` service still has a hardcoded `http://localhost:8003` call. This does not affect the unified `app/` backend but would fail if someone runs the old docker-compose setup without the optimization service container.

5. **`forecast_service/main.py` uses deprecated `@app.on_event`** — FastAPI 0.141.1 deprecates this. The new `app/main.py` uses the modern `lifespan` handler correctly, but the original container entrypoints still use the old form.

### Resolved in this sprint

- ~~Rule-based Copilot~~ → Real Amazon Bedrock Converse API with tool use
- ~~All buttons were non-functional~~ → Every button has a handler and relevant action
- ~~Delhi/generic building data~~ → Mumbai MSEDCL feeders throughout
- ~~Hardcoded values in KPI cards~~ → Computed from live data (buildings.length, feederState, retrofits)
- ~~No dark mode in Grid Operator tab~~ → Full CSS variable theming via `tokens.css` default-dark
- ~~Only Dharavi North shown in Buildings tab~~ → Feeder dropdown selects all 6 zones with independent data
- ~~404 on telemetry/current cold start~~ → Synthesizes from feeder state
- ~~NS/Office.AI logo in topbar~~ → Removed; topbar is clean GridFlex AI

---
## 13. Hackathon Extensions (Added)

### SQLAlchemy Models & Database
- Added SQLAlchemy models in pp/models/: Building, Equipment, EnergyConsumption, Retrofit, DRParticipation, GridState, FlexibilityAsset, Simulation, SimulationResult (SQLite-compatible with string UUIDs).
- Database setup in pp/db/: database.py (SessionLocal, Base) and init_db.py for table creation.

### Groq LLM Integration
- Groq service wrapper in pp/services/groq_service.py with structured JSON response support.
- Prompt templates in pp/utils/prompt_templates.py for retrofit recommendations, anomaly diagnosis, and DR optimization.
- Supporting utilities: aseline_calculator.py, nomaly_detector.py, constants.py, discrete_event_sim.py.

### Hackathon API Routes
- New routes added: pi/buildings.py, pi/retrofits.py, pi/equipment.py, pi/grid_hackathon.py, pi/sim_hackathon.py, pi/buildings_extra.py.
- All registered in pp/main.py.

### Frontend Extensions
- Zustand stores, API services, custom hooks, and onboarding tour components (see git history).
