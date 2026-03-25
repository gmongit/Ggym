from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models.user import User
from ..models.exercise import Exercise
from ..models.workout import Set
from ..schemas.exercise import ExerciseCreate, ExerciseResponse
from ..schemas.workout import SetResponse
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/exercises", tags=["exercises"])

@router.get("/", response_model=List[ExerciseResponse])
def get_exercises(
    muscle_group: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Exercise).filter(
        (Exercise.created_by == None) | (Exercise.created_by == current_user.id)
    )
    if muscle_group:
        query = query.filter(Exercise.muscle_group == muscle_group)
    return query.all()

@router.post("/", response_model=ExerciseResponse)
def create_exercise(
    exercise_data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = Exercise(**exercise_data.model_dump(), created_by=current_user.id)
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise

@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")
    return exercise

@router.get("/{exercise_id}/history", response_model=List[SetResponse])
def get_exercise_history(
    exercise_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from ..models.workout import WorkoutSession
    sets = (
        db.query(Set)
        .join(WorkoutSession)
        .filter(
            Set.exercise_id == exercise_id,
            WorkoutSession.user_id == current_user.id
        )
        .order_by(WorkoutSession.date.desc())
        .limit(limit)
        .all()
    )
    return sets
