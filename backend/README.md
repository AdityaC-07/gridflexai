# GridFlex AI — Part A Backend

Hackathon MVP backend: demand/solar forecasting → grid intelligence → LP optimization
→ safety policy → operator approval → reliability metrics, served through one
frontend-facing Data/API service. Services communicate through DynamoDB.

## Architecture

```
DynamoDB telemetry → Forecast Service → DynamoDB forecasts
→ Grid Intelligence Service → DynamoDB feeder state
→ Optimization Service → DynamoDB decisions
→ Data/API Service → REST API → React frontend
```

Services: `forecast_service`, `grid_intelligence`, `optimization_service`, `data_api`
(shared helpers in `shared/`). Simulation Service is owned by the partner team and
only interacts by writing telemetry rows.

## Quickstart (local, Python 3.11)

```powershell
Copy-Item .env.example .env
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m pip install pytest "httpx==0.27.2"
.venv\Scripts\python.exe -m pytest tests -q
```

## LOCAL DEVELOPMENT — ONE PROCESS

Start the unified backend with ONE command from the backend/ directory:

```powershell
# Using the venv in gridflex-backend/
../gridflex-backend/.venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

This runs all services (forecast, grid intelligence, optimization, data/api, copilot, verification) in a single FastAPI process with in-memory storage. No AWS credentials required.

Health check: `GET http://localhost:8000/health`

### Local Architecture

```
React Frontend
       ↓
Unified FastAPI Application (port 8000)
       ↓
 ┌───────────────┬────────────────┬────────────────┐
 │ Forecast      │ Grid Intel     │ Optimization   │
 │ service       │ service        │ service        │
 └───────────────┴────────────────┴────────────────┘
       ↓
Shared Python modules
       ↓
In-memory store (local mode) / DynamoDB (AWS mode)
```

### Environment Variables

For local development, set in `.env`:

```
APP_MODE=local
AWS_REGION=ap-south-1
FEEDER_ID=F01
```

For AWS mode:

```
APP_MODE=aws
AWS_REGION=ap-south-1
# plus AWS credentials
```

## LEGACY MULTI-PROCESS MODE (for reference)

The old multi-terminal setup still works for testing individual services:

```powershell
.venv\Scripts\python.exe -m uvicorn forecast_service.main:app --port 8001
.venv\Scripts\python.exe -m uvicorn grid_intelligence.main:app --port 8002
.venv\Scripts\python.exe -m uvicorn optimization_service.main:app --port 8003
.venv\Scripts\python.exe -m uvicorn data_api.main:app --port 8004
```

Health: `GET /health` on each service.

## Environment variables

| Var | Default | Meaning |
|---|---|---|
| `AWS_REGION` | `ap-south-1` | AWS region (do not change) |
| `AWS_ENDPOINT_URL` | empty | Set for local DynamoDB |
| `DYNAMODB_TABLE_PREFIX` | `gridflex` | Table prefix |
| `FEEDER_ID` | `F01` | Demo feeder |
| `GRID_IMPORT_LIMIT` | `80` | kW grid import limit |
| `BATTERY_CAPACITY_KWH` | `200` | Community battery |
| `BATTERY_RESERVE_PCT` | `20` | Reserve floor |
| `BATTERY_MAX_DISCHARGE_KW` | `75` | Max discharge |
| `CRITICAL_LOAD_KW` | `48` | Protected critical load |

## API endpoints

Forecast service: `GET /health`, `GET /forecast/{feeder_id}`,
`POST /forecast/{feeder_id}/refresh`.

Grid Intelligence: `GET /health`, `GET /feeder/{feeder_id}/state`, `GET /feeders`.

Optimization: `GET /health`, `POST /optimization/run` (`{"feeder_id":"F01"}`),
`GET /optimization/{decision_id}?feeder_id=F01`,
`POST /optimization/{decision_id}/approve`.

Data/API (frontend calls ONLY this): `GET /health`, `GET /api/v1/feeders`,
`GET /api/v1/feeder/{id}/state`, `GET /api/v1/feeder/{id}/telemetry/current`,
`GET /api/v1/feeder/{id}/telemetry/history?hours=6`, `GET /api/v1/forecast/{id}`,
`GET /api/v1/optimization/{id}/latest`, `POST /api/v1/optimization/{id}/run`,
`POST /api/v1/optimization/{decision_id}/approve`,
`POST /api/v1/forecast/{id}/refresh`, `POST /api/v1/telemetry/{id}/ingest`,
`GET /api/v1/reliability/{id}/metrics`, `GET /api/v1/alerts/{id}`.

Stable example contracts: `mock_data/` (`feeder_state.json`, `forecast.json`,
`decision.json`, `alerts.json`, `reliability_metrics.json`, `telemetry_current.json`).

## DynamoDB tables (PAY_PER_REQUEST, `ap-south-1`)

`gridflex-telemetry` (feeder_id, timestamp), `gridflex-forecasts` (feeder_id, timestamp),
`gridflex-feeder-state` (feeder_id, timestamp), `gridflex-decisions` (feeder_id, decision_id),
`gridflex-battery` (feeder_id), `gridflex-reliability-events` (feeder_id, timestamp).

```powershell
.venv\Scripts\python.exe infra\create_tables.py
```

## Docker

```powershell
docker compose build
docker compose up
```

## AWS deployment (human steps remaining — see final report)

Task definitions: `infra/task_definitions/*.json`; IAM: `infra/iam_policy.json`.
ECR/ECS/API-Gateway/CloudWatch commands are listed in the implementation report.

## Demo sequence (works offline; DynamoDB used when available)

```powershell
# 1. ingest evening-peak telemetry with cloud event
curl -X POST localhost:8000/api/v1/telemetry/F01/ingest -H "Content-Type: application/json" -d "{\"demand_kw\":85.0,\"solar_kw\":45.0,\"battery_soc_pct\":80.0,\"battery_soc_kwh\":160.0,\"temperature_c\":30.0,\"timestamp\":\"2026-09-19T18:00:00Z\"}"
# 2. refresh forecast (with cloud event)
curl -X POST localhost:8000/api/v1/forecast/F01/refresh -H "Content-Type: application/json" -d "{\"cloud_event\":{\"active\":true,\"severity\":0.8,\"start_slot\":0,\"duration_slots\":5}}"
# 3. feeder state / gap / stress / risk
curl localhost:8000/api/v1/feeder/F01/state
# 4. run optimization (LP, heuristic fallback) + policy + explanation
curl -X POST localhost:8000/api/v1/optimization/F01/run
# 5. approve as operator (MVP always requires manual approval; auto_execute=false)
curl -X POST localhost:8000/api/v1/optimization/<decision_id>/approve -H "Content-Type: application/json" -d "{\"feeder_id\":\"F01\"}"
# 6. baseline vs GridFlex reliability
curl localhost:8000/api/v1/reliability/F01/metrics
```

## Troubleshooting

- `No forecast for feeder` → call the refresh endpoint first.
- DynamoDB `ResourceNotFoundException` → run `infra/create_tables.py`; offline
  memory fallbacks keep the demo running and are marked `source="memory"`.
- LP failure → automatic `HEURISTIC` fallback (`fallback_reason` in result).
- Model missing → deterministic fallback forecast; service retrains on startup.
