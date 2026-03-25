from pydantic import BaseModel
from typing import Optional
from ..models.exercise import MuscleGroup, ExerciseType

class ExerciseCreate(BaseModel):
    name: str
    muscle_group: MuscleGroup
    exercise_type: ExerciseType

class ExerciseResponse(BaseModel):
    id: int
    name: str
    muscle_group: MuscleGroup
    exercise_type: ExerciseType
    created_by: Optional[int] = None

    model_config = {"from_attributes": True}
