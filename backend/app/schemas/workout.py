from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SetCreate(BaseModel):
    exercise_id: int
    weight_kg: float
    reps: int
    rir: Optional[int] = None
    set_number: int

class SetResponse(BaseModel):
    id: int
    exercise_id: int
    weight_kg: float
    reps: int
    rir: Optional[int] = None
    set_number: int

    model_config = {"from_attributes": True}

class WorkoutSessionCreate(BaseModel):
    date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    perceived_exertion: Optional[int] = None

class WorkoutSessionUpdate(BaseModel):
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    perceived_exertion: Optional[int] = None

class WorkoutSessionResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    duration_minutes: Optional[int] = None
    notes: Optional[str] = None
    perceived_exertion: Optional[int] = None
    sets: List[SetResponse] = []

    model_config = {"from_attributes": True}
