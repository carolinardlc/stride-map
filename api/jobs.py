"""Background job store and optimization runner"""

import json
import os
import re
import uuid
import traceback
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional

import numpy as np
import pandas as pd

CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "outputs")

from ciudad_15min.data_loader import (
    load_place_boundary, load_walking_graph, load_services, load_residences
)
from ciudad_15min.coverage import evaluate_all_categories
from ciudad_15min.optimization import run_reordering_optimization_all_categories


@dataclass
class Job:
    id: str
    status: str  # pending | loading_data | evaluating | optimizing | finalizing | done | failed
    params: dict
    progress: list = field(default_factory=list)
    result: Optional[dict] = None
    error: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)


# In-memory job store
jobs: Dict[str, Job] = {}

# Limit concurrent jobs to avoid memory issues
MAX_CONCURRENT_JOBS = 2


def create_job(params: dict) -> Job:
    running = sum(1 for j in jobs.values() if j.status not in ("done", "failed"))
    if running >= MAX_CONCURRENT_JOBS:
        raise RuntimeError(f"Too many concurrent jobs ({running}/{MAX_CONCURRENT_JOBS}). Wait for one to finish.")

    job = Job(
        id=str(uuid.uuid4())[:8],
        status="pending",
        params=params,
    )
    jobs[job.id] = job
    return job


def _gdf_to_geojson(gdf) -> dict:
    """Convert GeoDataFrame to GeoJSON dict."""
    return json.loads(gdf.to_json())


def _log(job: Job, phase: str, message: str):
    job.status = phase
    job.progress.append({"phase": phase, "message": message})


def _place_to_folder(place: str) -> str:
    """Convert place name to folder name, matching main.py logic."""
    name = place.split(",")[0].strip()
    return re.sub(r'[^\w\s-]', '', name).strip().lower().replace(' ', '_')


def _cache_path(place: str) -> str:
    return os.path.join(CACHE_DIR, _place_to_folder(place), "result.json")


def load_cached_result(place: str) -> Optional[dict]:
    path = _cache_path(place)
    if os.path.exists(path):
        with open(path, 'r') as f:
            return json.load(f)
    return None


def _save_cache(place: str, result: dict):
    path = _cache_path(place)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(result, f)


def run_optimization_sync(job: Job):
    """Run the full optimization pipeline. Called in a thread."""
    try:
        p = job.params

        # Phase 1: Load data
        _log(job, "loading_data", "Loading district boundary...")
        boundary = load_place_boundary(p["place"])

        _log(job, "loading_data", "Loading walking network...")
        G = load_walking_graph(boundary, speed_kmh=p["speed_kmh"])

        _log(job, "loading_data", f"Walking network: {G.number_of_nodes()} nodes, {G.number_of_edges()} edges")

        _log(job, "loading_data", "Loading services...")
        services = load_services(boundary)
        for cat, gdf in services.items():
            _log(job, "loading_data", f"  {cat}: {len(gdf)} points")

        _log(job, "loading_data", "Loading residences...")
        homes = load_residences(boundary, max_points=p.get("max_homes"))
        _log(job, "loading_data", f"Residences: {len(homes)}")

        # Phase 2: Initial evaluation
        _log(job, "evaluating", "Evaluating initial coverage...")
        initial_reach, initial_metrics = evaluate_all_categories(
            G, homes, services, p["minutes"]
        )

        for k, v in initial_metrics.items():
            _log(job, "evaluating", f"  {k}: {v:.1%}")

        # Phase 3: Optimization
        _log(job, "optimizing", "Starting NSGA-II optimization...")

        # Build track_generations list (same logic as main.py)
        max_gen = p["generations"]
        mid_start = max(1, (max_gen // 2) - 4)
        mid_end = min(max_gen, mid_start + 9)
        last_start = max(1, max_gen - 9)
        track_generations = (
            list(range(1, 11))
            + list(range(mid_start, mid_end + 1))
            + list(range(last_start, max_gen + 1))
        )

        # Call the optimization directly
        final_homes, final_services, pareto_df, best_covs, callback = \
            run_reordering_optimization_all_categories(
                G=G,
                homes=homes,
                services=services,
                minutes=p["minutes"],
                max_gen=max_gen,
                pop_size=p["population"],
                track_generations=track_generations,
            )

        # Phase 4: Final evaluation
        _log(job, "finalizing", "Evaluating optimized coverage...")
        final_reach, final_metrics = evaluate_all_categories(
            G, final_homes, final_services, p["minutes"]
        )

        for k, v in final_metrics.items():
            _log(job, "finalizing", f"  {k}: {v:.1%}")

        # Build comparison
        comparison = []
        for key in initial_metrics:
            comparison.append({
                "metric": key,
                "initial": initial_metrics[key],
                "final": final_metrics[key],
                "improvement": final_metrics[key] - initial_metrics[key],
            })

        # Convert GeoDataFrames to GeoJSON for the API response
        homes_initial_out = homes.copy()
        homes_initial_out["covered_all"] = initial_reach["all_categories"].values
        for cat in services:
            homes_initial_out[f"reach_{cat}"] = initial_reach[f"reach_{cat}"].values

        homes_optimized_out = final_homes.copy()
        homes_optimized_out["covered_all"] = final_reach["all_categories"].values
        for cat in final_services:
            homes_optimized_out[f"reach_{cat}"] = final_reach[f"reach_{cat}"].values

        services_initial_geojson = {}
        for cat, gdf in services.items():
            services_initial_geojson[cat] = _gdf_to_geojson(gdf)

        services_optimized_geojson = {}
        for cat, gdf in final_services.items():
            services_optimized_geojson[cat] = _gdf_to_geojson(gdf)

        # Store result
        job.result = {
            "place": p["place"],
            "boundary": _gdf_to_geojson(boundary),
            "initial_metrics": initial_metrics,
            "final_metrics": final_metrics,
            "comparison": comparison,
            "homes_initial": _gdf_to_geojson(homes_initial_out),
            "homes_optimized": _gdf_to_geojson(homes_optimized_out),
            "services_initial": services_initial_geojson,
            "services_optimized": services_optimized_geojson,
        }

        # Save to disk cache
        _save_cache(p["place"], job.result)

        _log(job, "done", "Optimization complete")
        job.status = "done"

    except Exception as e:
        job.status = "failed"
        job.error = str(e)
        job.progress.append({
            "phase": "failed",
            "message": f"Error: {e}",
        })
        traceback.print_exc()
