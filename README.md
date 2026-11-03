# Stormlane

Weather-aware truck routing. Stormlane gets truck routes from Valhalla (OpenStreetMap), checks the
Open-Meteo forecast at points along each route based on when the truck will reach them, scores
wind, rain and snow risk against the truck's load, and recommends the safest route.

## Stack

- Frontend: React 18, Vite, TypeScript, Tailwind CSS
- Backend: Django 5.2 (ASGI), Django REST Framework
- APIs: Valhalla truck routing (OSM), Open-Meteo geocoding and weather
- Hosting: Vercel (frontend), Render (backend)

## Project structure

```
backend/
  stormlane/
    core/       routing and risk logic
    routing/    Valhalla client
    weather/    Open-Meteo client
    api/        endpoints
  tests/
frontend/
  src/
```

## Setup

Requirements: Python 3.14, Node 22, and optionally Docker.

```bash
cp .env.example .env
```

### Docker

```bash
docker compose up --build
```

### Local

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn stormlane.asgi:application --reload --port 8000
```

Frontend:

```bash
cd frontend
nvm use
npm install
npm run dev
```

The app runs at http://localhost:5173 and the API at http://localhost:8000. In development, Vite
proxies `/api` to the backend.

## Checks

Backend:

```bash
ruff check .
ruff format --check .
mypy .
pytest
```

Frontend:

```bash
npm run lint
npm run format:check
npm run typecheck
npm test
npm run build
```

## Environment variables

| Variable               | Description                                  |
| ---------------------- | -------------------------------------------- |
| `DJANGO_DEBUG`         | Enables debug mode                           |
| `DJANGO_SECRET_KEY`    | Required when debug is off                   |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated list of hosts                |
| `CORS_ALLOWED_ORIGINS` | Origins allowed to call the API              |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF                     |
| `REDIS_URL`            | Redis cache; uses in-memory cache when empty |
| `VALHALLA_URL`         | Valhalla route endpoint                      |
| `OPEN_METEO_BASE_URL`  | Open-Meteo forecast endpoint                 |
| `HEATMAP_MAX_CELLS`    | Max cells in the corridor heatmap grid       |
| `LOG_LEVEL`            | Log level, defaults to `INFO`                |
| `VITE_API_URL`         | Backend URL for production builds            |
