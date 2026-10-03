# GridFlex AI

**Real-time community grid intelligence, demand response, and reliability orchestration for Mumbai's MSEDCL distribution network.**

> Live deployment: **[https://d3pi56i3w5vugt.cloudfront.net](https://d3pi56i3w5vugt.cloudfront.net)**  
> Backend API: `ap-south-1` · ECS Fargate · DynamoDB · Groq

---

## What it does

GridFlex AI coordinates community-scale energy resources — rooftop solar, battery storage, EV chargers, water heaters, and HVAC — on a single distribution feeder (reference: **Feeder F01, Dharavi North, Mumbai**).

When the system detects a reliability risk:

1. **Forecasts** 24-hour demand and solar generation (Ridge regression + physics model)
2. **Computes** live grid stress, energy gap, and risk level (LOW → CRITICAL)
3. **Assembles** a ranked flexibility pool from enrolled community resources using Reliability Budget Score (RBS)
4. **Optimises** a dispatch plan via Linear Programming (scipy `linprog`) with heuristic fallback
5. **Enforces** four safety policy checks (R1–R4): critical load protection, battery reserve floor, forecast confidence gate, unserved energy limit
6. **Waits** for operator approval — nothing auto-dispatches
7. **Verifies** actual vs planned compliance after a reliability event closes
8. **Explains** everything in natural language via the Groq AI Copilot

---

## Live links

| Surface | URL |
|---|---|
| Frontend (CloudFront) | [https://d3pi56i3w5vugt.cloudfront.net](https://d3pi56i3w5vugt.cloudfront.net) |
| API health check | Backend on ECS Fargate (ap-south-1) |
| API docs | `/docs` (Swagger UI) on the backend |

---

## Tech stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Python 3.11, FastAPI, Uvicorn |
| Forecast | Ridge regression (scikit-learn) + physics solar irradiance model |
| Optimisation | scipy `linprog` LP + deterministic heuristic fallback |
| Safety policy | R1–R4 rule engine (critical load, battery reserve, confidence, unserved energy) |
| Storage (local) | Thread-safe in-memory Python dicts |
| Storage (prod) | AWS DynamoDB (7 tables, PAY_PER_REQUEST) |
| AI Copilot | Groq — OpenAI-compatible API, `openai/gpt-oss-120b`, tool-use loop |
| Alerts | AWS SNS (HIGH/CRITICAL events) |
| Events | AWS EventBridge (reliability lifecycle) |
| Deployment | AWS ECS Fargate, ECR, ap-south-1 |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18, Vite |
| Styling | Inline styles + CSS variables (dark/light theme) |
| Charts | Recharts (forecast chart, DR earnings, energy trend) |
| Icons | Lucide React |
| Routing | React Router v6 (11 pages) |
| Hosting | AWS S3 + CloudFront |
| Fonts | Syne, Cinzel, Outfit, JetBrains Mono (Google Fonts) |

---

## AWS services used

| Service | Purpose |
|---|---|
| **ECS Fargate** | Runs the unified FastAPI backend (no server management) |
| **ECR** | Container registry for backend Docker images |
| **DynamoDB** | Primary data store: telemetry, forecasts, feeder state, decisions, battery, reliability events, flexibility pool |
| **S3** | Hosts the production React build |
| **CloudFront** | CDN for the frontend — global edge delivery |
| **SNS** | Publishes alerts when feeder risk reaches HIGH or CRITICAL |
| **EventBridge** | Orchestrates the reliability event lifecycle (PREDICTED → APPROVED → DISPATCHED → VERIFIED) |
| **IAM** | Task roles for ECS containers |

LLM inference for the AI Copilot is provided by **Groq** (not an AWS service) — see the AI Copilot section below.

---

## Repository layout

```
gridflexai/
├── backend/
│   ├── app/                        ← Unified FastAPI application
│   │   ├── main.py                 ← Single entrypoint: uvicorn app.main:app
│   │   ├── config.py               ← All config (APP_MODE, Groq, grid params)
│   │   ├── core/
│   │   │   ├── store.py            ← Storage abstraction: local dict ↔ DynamoDB
│   │   │   └── local_dynamo_patch.py
│   │   ├── api/                    ← FastAPI routers (one per domain)
│   │   │   ├── telemetry.py
│   │   │   ├── forecast.py
│   │   │   ├── grid.py
│   │   │   ├── optimization.py
│   │   │   ├── reliability.py
│   │   │   ├── events.py
│   │   │   ├── flexibility.py
│   │   │   ├── copilot.py          ← /query + /status + /ask
│   │   │   └── simulation.py
│   │   ├── services/               ← Pure Python service wrappers
│   │   └── agents/
│   │       └── gridflex_copilot/   ← Groq AI layer
│   │           ├── agent.py        ← LLM agentic loop (up to 6 tool rounds)
│   │           ├── llm.py          ← Groq client + OpenAI ⇄ Converse format adapter
│   │           ├── prompts.py      ← System prompt + 10 tool specs
│   │           ├── tools.py        ← 10 read-only GridFlex tool implementations
│   │           ├── permissions.py  ← Allowlist/denylist security layer
│   │           └── schemas.py      ← Pydantic request/response models
│   ├── forecast_service/           ← Original per-service code (production containers)
│   ├── grid_intelligence/
│   ├── optimization_service/
│   ├── verification_service/
│   ├── shared/                     ← DynamoDB helpers, config, Pydantic models
│   ├── infra/                      ← ECS task definitions, IAM, EventBridge, DynamoDB setup
│   ├── tests/                      ← 115 unit tests (all passing)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx                 ← Router: 11 routes
│   │   ├── config.js               ← API base URL (Vite proxy in dev)
│   │   ├── api/                    ← Axios client + per-domain API functions
│   │   ├── context/
│   │   │   ├── BuildingContext.jsx ← Theme, 6 Mumbai feeder buildings, retrofits
│   │   │   └── GridStateContext.jsx← Live grid state, polling, cloud event simulation
│   │   ├── pages/                  ← 11 pages (all routed and functional)
│   │   └── components/
│   │       └── copilot/
│   │           └── CopilotPanel.jsx← Groq AI Copilot UI
│   ├── public/
│   │   └── favicon.svg             ← GridFlex AI brand favicon
│   ├── index.html
│   └── vite.config.js              ← Proxy: /api/* → :8000
├── docs/
│   └── CLAUDE.md                   ← Full engineering reference
└── README.md                       ← This file
```

---

## Running locally

### Backend (one command)

```bash
cd backend

# First time
cp .env.example .env

pip install -r requirements.txt

uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs
```

No Docker, no DynamoDB, no AWS credentials required (`APP_MODE=local` uses in-memory store).

### Frontend

```bash
cd frontend

npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api/*` and `/simulation/*` to `localhost:8000` — no CORS issues.

### Enable the Groq AI Copilot

```bash
# In backend/.env:
GROQ_ENABLED=true
GROQ_MODEL=openai/gpt-oss-120b
GROQ_API_KEY=gsk_...   # from https://console.groq.com/keys
```

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `APP_MODE` | `local` | `local` = in-memory store; `aws` = DynamoDB |
| `AWS_REGION` | `ap-south-1` | Region for DynamoDB |
| `FEEDER_ID` | `F01` | Default feeder (Dharavi North) |
| `GRID_IMPORT_LIMIT` | `80` | kW — grid import ceiling |
| `BATTERY_CAPACITY_KWH` | `200` | Community BESS capacity |
| `BATTERY_RESERVE_PCT` | `20` | % SoC floor — safety constraint |
| `CRITICAL_LOAD_KW` | `48` | kW always protected, never shed |
| `GROQ_ENABLED` | `true` | `true` to activate AI Copilot |
| `GROQ_API_KEY` | `` | Groq API key (required for live mode) |
| `GROQ_MODEL` | `openai/gpt-oss-120b` | Groq foundation model |
| `GROQ_MAX_TOKENS` | `1024` | Max tokens per response |
| `GROQ_TEMPERATURE` | `0.5` | Sampling temperature |
| `SNS_ENABLED` | `false` | Enable SNS alerts |
| `SNS_TOPIC_ARN` | `` | ARN of SNS topic |

### Frontend (`frontend/.env`)

| Variable | Default | Purpose |
|---|---|---|
| `VITE_API_URL` | `` | Empty = use Vite proxy. Set to backend URL for direct calls |
| `VITE_USE_MOCK` | `false` | `true` = always return mock data |

---

## API routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check with per-service status |
| `GET` | `/api/v1/feeders` | List feeder IDs |
| `GET` | `/api/v1/feeder/{id}/state` | Live feeder state (risk, gap, stress, battery) |
| `GET` | `/api/v1/feeder/{id}/telemetry/current` | Latest telemetry reading |
| `GET` | `/api/v1/feeder/{id}/telemetry/history` | Telemetry history (`?hours=6`) |
| `POST` | `/api/v1/telemetry/{id}/ingest` | Ingest raw telemetry |
| `GET` | `/api/v1/forecast/{id}` | 48-slot demand + solar forecast |
| `POST` | `/api/v1/forecast/{id}/refresh` | Trigger forecast cycle |
| `GET` | `/api/v1/optimization/{id}/latest` | Latest LP decision |
| `POST` | `/api/v1/optimization/{id}/run` | Run optimisation |
| `POST` | `/api/v1/optimization/{decision_id}/approve` | Operator approval |
| `GET` | `/api/v1/reliability/{id}/metrics` | Baseline vs GridFlex SAIDI/SAIFI |
| `GET` | `/api/v1/alerts/{id}` | Derived feeder alerts |
| `GET` | `/api/v1/events` | List reliability events |
| `GET` | `/api/v1/events/{event_id}` | Event detail |
| `POST` | `/api/v1/events/{event_id}/approve` | Approve event for dispatch |
| `POST` | `/api/v1/events/{event_id}/optimize` | Run reliability budget optimisation |
| `POST` | `/api/v1/events/simulate` | Full in-process reliability pipeline |
| `GET` | `/api/v1/pool` | Ranked flexibility pool |
| `POST` | `/api/v1/copilot/query` | AI Copilot query (Groq) |
| `GET` | `/api/v1/copilot/status` | Groq availability + config |
| `POST` | `/simulation/event` | Inject cloud event scenario |
| `GET` | `/simulation/status` | Simulation state |
| `POST` | `/simulation/reset` | Reset to baseline |

---

## Frontend pages

| Route | Page | Description |
|---|---|---|
| `/` | Landing | Product showcase with live telemetry chart demo |
| `/dashboard` | Dashboard | 6 Mumbai feeder cards with live F01 data |
| `/buildings/:id` | Buildings | Per-feeder details, 7/30/90-day chart, equipment, anomalies |
| `/analytics` | Grid Ops | DR earnings, MSEDCL grid mix, BESS dispatch |
| `/retrofits` | Retrofits | Capital plan with computed KPIs, CSV export |
| `/equipment` | Equipment | Design system + anomaly severity catalog |
| `/operator` | Grid Operator | Live telemetry, forecast, optimization, **AI Copilot** |
| `/simulation` | Simulation | Cloud event injection (79% severity, 150 min) |
| `/reliability` | Reliability | Baseline vs GridFlex SAIDI/SAIFI metrics |
| `/discom` | DISCOM | Executive reliability dashboard, feeder registry |
| `/resident` | Resident | Consumer view, active event notifications, credits |

---

## AI Copilot

The **GridFlex Reliability Copilot** sits at the bottom of the `/operator` page, powered by Groq.

**Architecture:**
```
User question
    ↓  POST /api/v1/copilot/query
Groq API (openai/gpt-oss-120b, OpenAI-compatible chat completions)
    ↓  toolCall
Permission check (allowlist — 37 security tests)
    ↓  ALLOWED
GridFlex tool execution (reads live services, never writes)
    ↓  tool result
Groq → natural-language answer
    ↓
Response: { answer, model, tools_used, sources, latency_ms, mode }
```

**10 read-only tools:** `get_current_grid_state`, `get_forecast`, `get_active_reliability_events`, `get_reliability_event`, `get_flexibility_pool`, `get_spatial_state`, `get_reliability_metrics`, `simulate_optimization` (in-memory only), `explain_dispatch_plan`, `compare_forecast_actual`

**Security:** The permission layer blocks all write/dispatch/approval/infrastructure operations. Tested with 37 dedicated permission tests.

**Graceful degradation:** When Groq is unavailable, returns deterministic live GridFlex data with an honest label — never fabricates an AI answer.

---

## Tests

```bash
cd backend

# Unit tests (no API key required)
pytest tests/ --ignore=tests/copilot/test_groq_integration.py -v

# Groq integration (requires GROQ_API_KEY)
pytest tests/copilot/test_groq_integration.py -v -m integration
```

| Suite | Tests |
|---|---|
| Demand model | 5 |
| Gap calculator + risk engine | 8 |
| LP optimiser + heuristic | 6 |
| Policy layer (R1–R4) | 6 |
| Reliability metrics | 5 |
| Reliability event schema | 5 |
| Solar model | 6 |
| Copilot permissions | 37 |
| Groq client (mocked) | 29 |
| Agent loop (mocked) | 8 |
| Groq integration (real, skipped without key) | 5 |
| **Total (unit)** | **115** |

---

## Safety model

Every optimisation decision carries four non-negotiable policy checks before it reaches the operator:

| Rule | Check | Action if failed |
|---|---|---|
| **R1** | Critical load shedding = 0 kW | Hard block — decision status = BLOCKED |
| **R2** | Battery SoC after dispatch ≥ 20% reserve | Hard block |
| **R3** | Forecast confidence ≥ 60% | Escalate to manual review |
| **R4** | Unserved energy ≤ 50 kWh | Escalate to manual review |

`auto_execute` is permanently `false`. Nothing dispatches without an operator pressing Approve.

---

## DynamoDB schema

| Table | Hash key | Range key |
|---|---|---|
| `gridflex-telemetry` | `feeder_id` | `timestamp` |
| `gridflex-forecasts` | `feeder_id` | `timestamp` |
| `gridflex-feeder-state` | `feeder_id` | `timestamp` |
| `gridflex-decisions` | `feeder_id` | `decision_id` |
| `gridflex-battery` | `feeder_id` | — |
| `gridflex-reliability-events` | `event_id` | — |
| `gridflex-flexibility-pool` | `resource_id` | — |

---

## Reliability event lifecycle

```
Telemetry ingested
    → Grid intelligence cycle detects gap > 20 kW + risk HIGH/CRITICAL
    → Reliability event PREDICTED (SNS alert sent)
    → Operator reviews → OPERATOR_APPROVED
    → Reliability budget LP optimization → dispatch plan attached
    → Operator approves dispatch → DISPATCHED
    → EventBridge triggers verification after event window
    → Verification service checks actual vs planned compliance → VERIFIED
    → CLOSED
```

---

## Contributing

```bash
git checkout -b feat/your-feature
# make changes
npm run build          # frontend must build clean
pytest tests/ --ignore=tests/copilot/test_groq_integration.py   # backend must pass
git commit -m "feat: description"
git push origin feat/your-feature
# open pull request to main
```

**Never commit:** `.env`, AWS credentials, `node_modules/`, `dist/`, `.venv/`, `__pycache__/`.
