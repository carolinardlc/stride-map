# StrideMap

A 15-minute city planning system that optimizes urban accessibility. StrideMap analyzes whether all residents in a district can reach essential services — health, education, green spaces, and work — within 15 minutes of walking, then proposes minimal changes to achieve full coverage.

## Overview

StrideMap uses real data from OpenStreetMap and a multi-objective optimization algorithm (NSGA-II) to evaluate and improve service accessibility across urban districts. It provides interactive before/after maps showing the impact of proposed changes.

**Key features:**
- Loads real pedestrian networks, services, and residences from OpenStreetMap
- Evaluates walking accessibility coverage for 4 service categories
- Optimizes service placement using NSGA-II to maximize coverage
- Generates interactive before/after maps for comparison
- Full-stack web interface with a FastAPI backend and Next.js frontend

## Project Structure

```
stride-map/
├── ciudad_15min/          # Core optimization engine
│   ├── constants.py       # Service categories and OSM query config
│   ├── data_loader.py     # OSM data loading with caching
│   ├── coverage.py        # Accessibility evaluation
│   ├── ga_operators.py    # NSGA-II genetic operators
│   ├── optimization.py    # Optimization problem and runner
│   ├── visualization.py   # Charts and map generation
│   └── main.py            # CLI entry point
├── api/                   # FastAPI backend
│   ├── app.py             # Application entry point
│   ├── routes.py          # API endpoints
│   ├── jobs.py            # Background job runner with caching
│   └── schemas.py         # Request/response models
├── frontend/              # Next.js web interface
│   ├── app/               # Pages and global styles
│   └── components/        # React components (map, windows, icons)
├── cache/                 # OSMnx data cache (auto-generated)
├── outputs/               # Results organized by district (auto-generated)
└── requirements.txt       # Python dependencies
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- Internet connection (for initial OSM data download)

## Installation

### Backend

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Usage

### Web Interface (recommended)

Start both the API and frontend:

```bash
# Terminal 1 — API
source venv/bin/activate
uvicorn api.app:app --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open http://localhost:3000, double-click the **StrideMap** icon, select a district, and click **Optimize**.

Results are cached — switching back to a previously analyzed district loads instantly.

### CLI

```bash
source venv/bin/activate
python ciudad_15min_reordenamiento.py --place "San Juan de Miraflores, Lima, Peru"
```

Results are saved to `outputs/<district_name>/`:

```
outputs/san_juan_de_miraflores/
├── maps/       # Interactive before/after HTML maps
├── charts/     # Coverage comparison, evolution, Pareto front
├── data/       # GeoJSON files, metrics CSV
└── tracking/   # NSGA-II evolution statistics
```

### CLI Options

| Flag | Default | Description |
|------|---------|-------------|
| `--place` | *required* | District name (e.g. `"Miraflores, Lima, Peru"`) |
| `--minutes` | `15.0` | Walking time threshold in minutes |
| `--speed-kmh` | `4.5` | Walking speed in km/h |
| `--generations` | `50` | NSGA-II generations |
| `--population` | `50` | NSGA-II population size |
| `--max-homes` | all | Limit number of residences to load |
| `--output-dir` | auto | Override output directory |
| `--plot` | off | Generate interactive maps |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/optimize` | Submit optimization job |
| `GET` | `/api/jobs/{id}` | Poll job status and progress |
| `GET` | `/api/jobs/{id}/result` | Get full results (GeoJSON + metrics) |
| `GET` | `/api/cache?place=...` | Load cached results for a district |
| `GET` | `/api/jobs` | List all jobs |
| `GET` | `/api/health` | Health check |

## Service Categories

| Category | Color | OSM Sources |
|----------|-------|-------------|
| Health | Red | Hospitals, clinics, pharmacies, dentists |
| Education | Blue | Schools, universities, kindergartens |
| Green Spaces | Green | Parks, gardens, playgrounds |
| Work | Purple | Offices, commercial areas, shops |

## How It Works

1. **Data loading** — Downloads the pedestrian network, service locations, and residential buildings from OpenStreetMap (cached locally after first download)
2. **Coverage evaluation** — For each home, calculates walking time to the nearest service in each category using Dijkstra's algorithm on the pedestrian graph
3. **Optimization** — NSGA-II multi-objective optimization proposes location swaps between service types to maximize coverage across all categories while minimizing total changes
4. **Results** — Generates before/after maps, coverage metrics, and evolution charts

## Supported Districts

The web interface includes all districts of Metropolitan Lima and Callao (50+ districts). The CLI accepts any place name that OpenStreetMap can geocode.

## License

MIT
