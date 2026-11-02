# Stormlane

Weather-aware truck routing. Stormlane asks HERE for three truck routes, samples the Open-Meteo
forecast at ETA-aware checkpoints along each one, classifies wind/rain/snow risk against the
truck's load, and recommends the safest route. A 0-48 h heatmap shows how risk moves across the
corridor over time.

> Status: project scaffold. Routing, weather, risk scoring and the map UI land in follow-up PRs.

## Stack

| Layer    | Tech                                                         |
| -------- | ------------------------------------------------------------ |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS v4, MapLibre GL JS  |
| Backend  | Django 5.2 (ASGI, uvicorn), Django REST Framework            |
| Data     | HERE Routing v8 + Autosuggest, Open-Meteo forecast           |
| Hosting  | Vercel (frontend), Render (backend)                          |

## Repository layout

```
stormlane/
  backend/                 Django project
    stormlane/
      core/                pure-Python geometry + risk algorithms (no I/O)
      routing/             HERE clients
      weather/             Open-Meteo client
      api/                 HTTP endpoints
    tests/
  frontend/                Vite + React + TS app
  .github/workflows/ci.yml lint, type-check, tests for both apps
  docker-compose.yml       local stack (backend, frontend, redis)
  .env.example             all environment variables
```

## Prerequisites

- Python 3.14 (3.12+ works)
- Node 22 (`nvm use` picks it up from `.nvmrc`)
- Docker (optional, for `docker compose`)

## Getting started

```bash
cp .env.example .env   # add HERE_API_KEY
```

### With Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API health: http://localhost:8000/api/health

### Without Docker

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn stormlane.asgi:application --reload --port 8000
```

Frontend (in another terminal):

```bash
cd frontend
nvm use
npm install
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8000`, so `VITE_API_URL` can stay empty
locally.

## Quality checks

These are the same commands CI runs.

Backend (from `backend/`):

```bash
ruff check .
ruff format --check .
mypy .
pytest
```

Frontend (from `frontend/`):

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

## Environment variables

See [`.env.example`](.env.example) for the full list.

| Variable               | Where    | Purpose                                              |
| ---------------------- | -------- | ---------------------------------------------------- |
| `DJANGO_DEBUG`         | backend  | Dev mode; also allows a default secret key           |
| `DJANGO_SECRET_KEY`    | backend  | Required when `DJANGO_DEBUG=false`                   |
| `DJANGO_ALLOWED_HOSTS` | backend  | Comma-separated hostnames                            |
| `CORS_ALLOWED_ORIGINS` | backend  | Frontend origins allowed to call the API             |
| `REDIS_URL`            | backend  | Optional; falls back to in-memory cache when empty   |
| `HERE_API_KEY`         | backend  | HERE Routing + Geocoding & Search                    |
| `VITE_API_URL`         | frontend | Backend origin in production; empty in local dev     |
