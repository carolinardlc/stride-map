"""API endpoints"""

import json
import asyncio
from concurrent.futures import ThreadPoolExecutor

from fastapi import APIRouter, HTTPException

from api.schemas import OptimizationRequest, JobCreated, JobStatus, OptimizationResult
from api.jobs import jobs, create_job, run_optimization_sync, load_cached_result

router = APIRouter(prefix="/api")

# Thread pool for CPU-bound optimization work
executor = ThreadPoolExecutor(max_workers=2)


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/optimize", response_model=JobCreated)
async def start_optimization(request: OptimizationRequest):
    try:
        job = create_job(request.model_dump())
    except RuntimeError as e:
        raise HTTPException(status_code=429, detail=str(e))

    # Run in background thread so we don't block the event loop
    loop = asyncio.get_event_loop()
    loop.run_in_executor(executor, run_optimization_sync, job)

    return JobCreated(job_id=job.id)


@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatus(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        error=job.error,
    )


@router.get("/jobs/{job_id}/result", response_model=OptimizationResult)
async def get_job_result(job_id: str):
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status == "failed":
        raise HTTPException(status_code=500, detail=job.error)
    if job.status != "done":
        raise HTTPException(status_code=202, detail="Job still running")

    r = job.result
    return OptimizationResult(
        job_id=job.id,
        place=r["place"],
        boundary=r["boundary"],
        initial_metrics=r["initial_metrics"],
        final_metrics=r["final_metrics"],
        comparison=r["comparison"],
        homes_initial=r["homes_initial"],
        homes_optimized=r["homes_optimized"],
        services_initial=r["services_initial"],
        services_optimized=r["services_optimized"],
    )


@router.get("/cache")
async def get_cached_result(place: str):
    result = load_cached_result(place)
    if not result:
        raise HTTPException(status_code=404, detail="No cached result")
    return result


@router.get("/jobs")
async def list_jobs():
    return [
        {
            "job_id": job.id,
            "status": job.status,
            "place": job.params.get("place"),
            "created_at": job.created_at.isoformat(),
        }
        for job in sorted(jobs.values(), key=lambda j: j.created_at, reverse=True)
    ]
