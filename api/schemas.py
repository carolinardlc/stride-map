"""Pydantic request/response models"""

from pydantic import BaseModel
from typing import Optional


class OptimizationRequest(BaseModel):
    place: str
    minutes: float = 15.0
    speed_kmh: float = 4.5
    max_homes: Optional[int] = None
    generations: int = 50
    population: int = 50
    categories: list[str] = ["health", "education", "greens", "work"]


class JobCreated(BaseModel):
    job_id: str


class ProgressEntry(BaseModel):
    phase: str
    message: str
    generation: Optional[int] = None
    best_objective: Optional[float] = None


class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: list[dict]
    error: Optional[str] = None


class OptimizationResult(BaseModel):
    job_id: str
    place: str
    boundary: dict
    initial_metrics: dict[str, float]
    final_metrics: dict[str, float]
    comparison: list[dict]
    homes_initial: dict
    homes_optimized: dict
    services_initial: dict[str, dict]
    services_optimized: dict[str, dict]
