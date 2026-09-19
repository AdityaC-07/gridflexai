# GridFlex AI — Forecast · Optimize · Protect

GridFlex AI is a community-solar + battery + flexible-load coordination system for an
urban electricity distribution feeder (reference feeder **F01 · Dharavi North**).
It forecasts 24-hour demand and solar generation, computes grid stress, runs an
LP optimization (battery dispatch + load shifting) behind a human-approval safety
gate (R1–R4), and reports baseline-vs-GridFlex reliability impact.

This repository contains the complete working system:

| Directory           | Contents                                                                 |
|---------------------|--------------------------------------------------------------------------|
| `gridflex-backend/` | Forecast service (Ridge demand + solar physics), grid intelligence, LP optimization (scipy + heuristic fallback), safety/policy layer, Data/API service (FastAPI), DynamoDB integration, tests, Dockerfiles, infra/deploy config |
| `gridflex-frontend/`| React + Vite operator console: Operator Dashboard, Scenario Simulator, Reliability, DISCOM executive view, Resident view — wired to the live Data/API |

> **Live deployment:** the Data/API has been run at `http://13.232.232.164:8000`
> (an ECS-task public IP — **it can change**; see
> [Pointing the frontend at the live API](#pointing-the-frontend-at-the-live-api)).
> The frontend talks to that base URL only through `VITE_API_URL`.

---

## 1. Prerequisites

- **Python** 3.11+ (backend)
- **Node.js** 20+ and **npm** (frontend)
- **Git**
- Optional: **Docker** (container runs), **AWS CLI + AWS credentials** (DynamoDB / ECS deploy)

---

## 2. Clone and repository layout

```bash
git clone https://github.com/AdityaC-07/gridflexai.git
cd gridflexai
```

```text
gridflexai/
├── README.md                  ← you are here (collaborator guide)
├── .gitignore
├── gridflex-backend/
│   ├── README.md              ← backend service details
│   ├── requirements.txt
│   ├── .env.example           ← copy to .env, never commit .env
│   ├── data_api/              ← the ONLY frontend-facing service (FastAPI)
│   ├── forecast_service/      ← Ridge demand + solar-physics forecasting
│   ├── grid_intelligence/     ← stress / risk / flexibility calculation
│   ├── optimization_service/  ← scipy linprog LP + heuristic fallback
│   ├── shared/                ← config, safety/policy layer (R1–R4)
│   ├── reliability_metrics.py ← baseline-vs-GridFlex impact math
│   ├── mock_data/             ← local dataset for offline/dev runs
│   ├── tests/                 ← backend tests
│   ├── infra/                 ← infra / ECS-ECR deployment config
│   └── docker-compose.yml
└── gridflex-frontend/
    ├── package.json
    ├── vite.config.js
    ├── .env.example           ← copy to .env, never commit .env
    └── src/
        ├── api/               ← Data/API client + per-resource normalization
        ├── context/           ← shared grid state, polling, scenario overlay
        ├── pages/             ← operator / simulation / reliability / discom / resident
        └── mock/              ← offline fallback + LOCAL scenario definition
```

---

## 3. Backend — run locally

```bash
cd gridflex-backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env        # fill in only if you use DynamoDB/AWS
```

Start the Data/API service (default port **8080**):

```bash
uvicorn data_api.main:app --host 0.0.0.0 --port 8080
```

Health check: `GET http://localhost:8080/health` → `{"status":"ok",...}`.

Run the tests:

```bash
pytest
```

Or run everything containerized:

```bash
docker compose up --build
```

### Backend API contract (served only by `data_api`)

| Method | Path                                              | Purpose                      |
|--------|---------------------------------------------------|------------------------------|
| GET    | `/health`                                         | Service health               |
| GET    | `/api/v1/feeders`                                 | Feeder registry (`{feeders:[...]}`) |
| GET    | `/api/v1/feeder/{id}/state`                       | Live feeder state/telemetry  |
| GET    | `/api/v1/feeder/{id}/telemetry/current`           | Latest telemetry point       |
| GET    | `/api/v1/feeder/{id}/telemetry/history?hours=6`   | Telemetry history            |
| GET    | `/api/v1/forecast/{id}`                           | 24h demand+solar series (ridge model) |
| GET    | `/api/v1/optimization/{id}/latest`                | Latest LP decision + policy checks |
| POST   | `/api/v1/optimization/{id}/run`                   | Trigger optimization run     |
| POST   | `/api/v1/optimization/{decision_id}/approve`      | Human approval (queues dispatch plan) |
| GET    | `/api/v1/reliability/{id}/metrics`                | Baseline-vs-GridFlex metrics |
| GET    | `/api/v1/alerts/{id}`                             | Feeder alerts (`{alerts:[...]}`) |

> **Known intentional limitation:** there are **no** `/simulation/*` backend
> endpoints (`/simulation/event`, `/simulation/reset`, `/simulation/status`
> return 404). The frontend's cloud-event scenario is deliberately
> **frontend-local** ("SCENARIO MODE · Local Scenario Injection"). Do **not**
> invent backend simulation endpoints — see
> [`gridflex-frontend/src/api/simulation.js`](gridflex-frontend/src/api/simulation.js).

Safety model: every optimization decision carries R1–R4 policy checks
(critical-load protection, battery reserve, forecast confidence, unserved-energy
limit). `auto_execute` is false — nothing actuates without operator approval.

---

## 4. Frontend — run locally

```bash
cd gridflex-frontend
npm install
cp .env.example .env
```

Edit `.env`:

```bash
# Local backend:
VITE_API_URL=http://localhost:8080
VITE_USE_MOCK=false
```

> `VITE_USE_MOCK=true` forces the offline mock dataset (useful with no backend).
> With `false`, the app calls the live API and falls back per-resource to mock
> data only if a request fails (a `DEMO / MOCK DATA` tag appears when fallback
> is active).

Start the dev server (default **http://localhost:5173**):

```bash
npm run dev
```

Production build:

```bash
npm run build    # must pass with no errors
npm run preview  # serve the production build locally
```

Routes: `/operator` · `/simulation` · `/reliability` · `/discom` · `/resident`.

### Pointing the frontend at the live API

Set `VITE_API_URL` to the current Data/API base URL (no trailing slash),
then **rebuild** — Vite inlines env vars at build time:

```bash
VITE_API_URL=http://13.232.232.164:8000
VITE_USE_MOCK=false
npm run build
```

No source-code change is needed to switch environments — only env + rebuild.

---

## 5. Demo rehearsal (5-minute script)

1. **`/operator`** — normal state: live telemetry (demand, solar, battery %,
   stress LOW), 24h forecast, balanced banner.
2. **`/simulation`** — press **Trigger Cloud Event — Severe (79%)**
   (labelled SCENARIO MODE · Local Scenario Injection), then **VIEW GRID IMPACT**.
3. **`/operator`** — scenario overlay: demand/solar/gap/stress shown as tagged
   **SCENARIO** values; optimization panel promoted to the top row;
   WHY auto-expanded; R1–R4 checks; press **Approve Recommendation**.
4. Approval state reads **APPROVED · DISPATCH PLAN QUEUED** (truthful: approval
   is recorded/queued, nothing auto-executes on the feeder).
5. **`/discom`** — executive baseline-vs-GridFlex impact (live metrics).
6. **`/resident`** — plain-language reassurance view (persona: Kavita).
7. **`/reliability`** — live impact metrics; reference-scenario narrative is
   tagged DEMO SNAPSHOT.

---

## 6. Working conventions (please preserve)

- The frontend talks **only** to the Data/API service. Never call
  forecast/optimization microservices directly from the UI.
- Displayed numbers must come from API responses (or the shared mock/scenario
  definitions in `src/mock/`), with `—` fallbacks — never hardcoded telemetry.
- `src/api/*` normalizes live-vs-mock shape differences; keep normalization in
  the API layer, not in components.
- Approval wording must stay truthful: approve/queue, never "execute".
- Scenario values must stay visibly tagged as scenario values.

---

## 7. Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| Frontend shows DEMO / MOCK DATA tag | Backend unreachable — check `VITE_API_URL`, backend process, CORS/security-group |
| Forecast chart empty | Confirm `GET /api/v1/forecast/F01` returns `demand`/`solar` arrays; normalization lives in `src/api/forecast.js` |
| `/simulation/*` 404s in Network tab | Expected — no backend simulation routes by design; frontend handles locally |
| `npm run build` fails | Run `npm install` first; build must pass before pushing |
| Stale live URL | ECS public IP changes on redeploy — update `VITE_API_URL`, rebuild, redeploy frontend |

---

## 8. Contributing / Git workflow

```bash
git checkout -b feat/<short-description>
# ... make focused changes ...
npm run build          # frontend changes must still build
pytest                 # backend changes must still pass tests (from gridflex-backend/)
git status && git diff --stat   # review before committing
git add <intentional files only>
git commit -m "feat: <what changed and why>"
git push -u origin feat/<short-description>
# open a Pull Request to main
```

**Never commit:** `.env` files, AWS credentials/access keys/secrets/tokens,
`key.json`-style key material, `node_modules/`, `dist/`, `.venv/`,
`__pycache__/`, build artifacts. The root `.gitignore` already excludes these —
if `git status` shows any of them as untracked-but-wanted, stop and fix the
ignore rules instead of force-adding.
