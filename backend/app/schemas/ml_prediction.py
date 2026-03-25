from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class MLPredictionRead(BaseModel):
    id: int
    exercise_id: int
    recommendation: str
    confidence: float
    model_version: str
    created_at: datetime

    model_config = {"from_attributes": True}


class MLFeedback(BaseModel):
    prediction_id: int
    helpful: bool


class WeeklySummary(BaseModel):
    week_start: str
    total_sessions: int
    total_volume_kg: float
    avg_perceived_exertion: Optional[float]
    top_exercises: list[str]
    recommendations: list[str]
