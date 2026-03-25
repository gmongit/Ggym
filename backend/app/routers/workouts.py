from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models.user import User
from ..models.workout import WorkoutSession, Set
from ..models.exercise import Exercise
from ..schemas.workout import (
    WorkoutSessionCreate, WorkoutSessionUpdate, WorkoutSessionResponse, SetCreate, SetResponse
)
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/workouts", tags=["workouts"])

@router.get("/", response_model=List[WorkoutSessionResponse])
def get_workouts(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(WorkoutSession)
        .filter(WorkoutSession.user_id == current_user.id)
        .order_by(WorkoutSession.date.desc())
        .limit(limit)
        .all()
    )

@router.post("/", response_model=WorkoutSessionResponse)
def create_workout(
    workout_data: WorkoutSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workout = WorkoutSession(
        user_id=current_user.id,
        date=workout_data.date or datetime.utcnow(),
        duration_minutes=workout_data.duration_minutes,
        notes=workout_data.notes,
        perceived_exertion=workout_data.perceived_exertion
    )
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return workout

@router.get("/volume-by-muscle")
def get_volume_by_muscle(
    weeks: int = 8,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_date = datetime.utcnow() - timedelta(weeks=weeks)

    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.date >= start_date,
        )
        .all()
    )

    # Übungen gecacht um N+1 zu vermeiden
    exercise_cache = {}

    weekly: dict = {}  # { sort_key: { week, muscle: volume } }

    for session in sessions:
        iso = session.date.isocalendar()
        sort_key = iso[0] * 100 + iso[1]
        week_label = f"KW {iso[1]:02d}"

        if sort_key not in weekly:
            weekly[sort_key] = {"week": week_label}

        for s in session.sets:
            if s.exercise_id not in exercise_cache:
                ex = db.query(Exercise).filter(Exercise.id == s.exercise_id).first()
                exercise_cache[s.exercise_id] = ex
            ex = exercise_cache[s.exercise_id]
            if ex:
                muscle = ex.muscle_group.value
                volume = round(s.weight_kg * s.reps, 1)
                weekly[sort_key][muscle] = round(weekly[sort_key].get(muscle, 0) + volume, 1)

    return [weekly[k] for k in sorted(weekly)]


@router.get("/sets-by-muscle")
def get_sets_by_muscle(
    weeks: int = 8,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_date = datetime.utcnow() - timedelta(weeks=weeks)

    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.date >= start_date,
        )
        .all()
    )

    exercise_cache = {}
    weekly: dict = {}

    for session in sessions:
        iso = session.date.isocalendar()
        sort_key = iso[0] * 100 + iso[1]
        week_label = f"KW {iso[1]:02d}"

        if sort_key not in weekly:
            weekly[sort_key] = {"week": week_label}

        for s in session.sets:
            if s.exercise_id not in exercise_cache:
                ex = db.query(Exercise).filter(Exercise.id == s.exercise_id).first()
                exercise_cache[s.exercise_id] = ex
            ex = exercise_cache[s.exercise_id]
            if ex:
                muscle = ex.muscle_group.value
                weekly[sort_key][muscle] = weekly[sort_key].get(muscle, 0) + 1

    return [weekly[k] for k in sorted(weekly)]


@router.get("/history", response_model=List[WorkoutSessionResponse])
def get_workout_history(
    exercise_id: Optional[int] = None,
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(WorkoutSession).filter(WorkoutSession.user_id == current_user.id)
    if exercise_id:
        query = query.join(Set).filter(Set.exercise_id == exercise_id)
    return query.order_by(WorkoutSession.date.desc()).limit(limit).all()

@router.get("/{workout_id}", response_model=WorkoutSessionResponse)
def get_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workout = db.query(WorkoutSession).filter(
        WorkoutSession.id == workout_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout

@router.put("/{workout_id}", response_model=WorkoutSessionResponse)
def update_workout(
    workout_id: int,
    workout_data: WorkoutSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workout = db.query(WorkoutSession).filter(
        WorkoutSession.id == workout_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    for field, value in workout_data.model_dump(exclude_unset=True).items():
        setattr(workout, field, value)
    db.commit()
    db.refresh(workout)
    return workout

@router.delete("/{workout_id}")
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workout = db.query(WorkoutSession).filter(
        WorkoutSession.id == workout_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")
    db.delete(workout)
    db.commit()
    return {"message": "Workout deleted"}

@router.post("/{workout_id}/sets", response_model=SetResponse)
def add_set(
    workout_id: int,
    set_data: SetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    workout = db.query(WorkoutSession).filter(
        WorkoutSession.id == workout_id,
        WorkoutSession.user_id == current_user.id
    ).first()
    if not workout:
        raise HTTPException(status_code=404, detail="Workout not found")

    new_set = Set(session_id=workout_id, **set_data.model_dump())
    db.add(new_set)
    db.commit()
    db.refresh(new_set)
    return new_set
