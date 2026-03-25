from pydantic import BaseModel
from typing import Optional


class TrainingDayExerciseCreate(BaseModel):
    exercise_id: int
    order: int = 0
    target_sets: int = 3
    target_reps_min: int = 8
    target_reps_max: int = 12


class TrainingDayExerciseResponse(BaseModel):
    id: int
    exercise_id: int
    exercise_name: str
    order: int
    target_sets: int
    target_reps_min: int
    target_reps_max: int

    model_config = {"from_attributes": True}


class TrainingDayCreate(BaseModel):
    name: str
    day_order: int = 0
    exercises: list[TrainingDayExerciseCreate] = []


class TrainingDayResponse(BaseModel):
    id: int
    name: str
    day_order: int
    exercises: list[TrainingDayExerciseResponse] = []

    model_config = {"from_attributes": True}


class TrainingPlanCreate(BaseModel):
    name: str
    days: list[TrainingDayCreate] = []


class TrainingPlanResponse(BaseModel):
    id: int
    name: str
    days: list[TrainingDayResponse] = []

    model_config = {"from_attributes": True}


class TrainingPlanSummary(BaseModel):
    id: int
    name: str
    day_count: int

    model_config = {"from_attributes": True}
