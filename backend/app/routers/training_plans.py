from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.exercise import Exercise
from ..models.training_plan import TrainingPlan, TrainingDay, TrainingDayExercise
from ..schemas.training_plan import (
    TrainingPlanCreate, TrainingPlanResponse, TrainingPlanSummary,
    TrainingDayCreate, TrainingDayResponse,
    TrainingDayExerciseCreate, TrainingDayExerciseResponse,
)
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/plans", tags=["plans"])


def _build_day_response(day: TrainingDay) -> TrainingDayResponse:
    return TrainingDayResponse(
        id=day.id,
        name=day.name,
        day_order=day.day_order,
        exercises=[
            TrainingDayExerciseResponse(
                id=e.id,
                exercise_id=e.exercise_id,
                exercise_name=e.exercise.name if e.exercise else "",
                order=e.order,
                target_sets=e.target_sets,
                target_reps_min=e.target_reps_min,
                target_reps_max=e.target_reps_max,
            )
            for e in day.exercises
        ]
    )


@router.get("/", response_model=list[TrainingPlanSummary])
def get_plans(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plans = db.query(TrainingPlan).filter(TrainingPlan.user_id == current_user.id).all()
    return [TrainingPlanSummary(id=p.id, name=p.name, day_count=len(p.days)) for p in plans]


@router.post("/", response_model=TrainingPlanResponse)
def create_plan(
    data: TrainingPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = TrainingPlan(user_id=current_user.id, name=data.name)
    db.add(plan)
    db.flush()

    for day_data in data.days:
        day = TrainingDay(plan_id=plan.id, name=day_data.name, day_order=day_data.day_order)
        db.add(day)
        db.flush()
        for ex_data in day_data.exercises:
            db.add(TrainingDayExercise(day_id=day.id, **ex_data.model_dump()))

    db.commit()
    db.refresh(plan)
    return TrainingPlanResponse(
        id=plan.id,
        name=plan.name,
        days=[_build_day_response(d) for d in plan.days]
    )


@router.get("/{plan_id}", response_model=TrainingPlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id, TrainingPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan nicht gefunden")
    return TrainingPlanResponse(
        id=plan.id,
        name=plan.name,
        days=[_build_day_response(d) for d in plan.days]
    )


@router.delete("/{plan_id}")
def delete_plan(plan_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id, TrainingPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan nicht gefunden")
    db.delete(plan)
    db.commit()
    return {"message": "Plan gelöscht"}


@router.post("/{plan_id}/days", response_model=TrainingDayResponse)
def add_day(
    plan_id: int,
    data: TrainingDayCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    plan = db.query(TrainingPlan).filter(TrainingPlan.id == plan_id, TrainingPlan.user_id == current_user.id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan nicht gefunden")

    day = TrainingDay(plan_id=plan_id, name=data.name, day_order=len(plan.days))
    db.add(day)
    db.flush()
    for ex_data in data.exercises:
        db.add(TrainingDayExercise(day_id=day.id, **ex_data.model_dump()))
    db.commit()
    db.refresh(day)
    return _build_day_response(day)


@router.delete("/days/{day_id}")
def delete_day(day_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    day = db.query(TrainingDay).join(TrainingPlan).filter(
        TrainingDay.id == day_id, TrainingPlan.user_id == current_user.id
    ).first()
    if not day:
        raise HTTPException(status_code=404, detail="Tag nicht gefunden")
    db.delete(day)
    db.commit()
    return {"message": "Tag gelöscht"}


@router.post("/days/{day_id}/exercises", response_model=TrainingDayExerciseResponse)
def add_exercise_to_day(
    day_id: int,
    data: TrainingDayExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    day = db.query(TrainingDay).join(TrainingPlan).filter(
        TrainingDay.id == day_id, TrainingPlan.user_id == current_user.id
    ).first()
    if not day:
        raise HTTPException(status_code=404, detail="Tag nicht gefunden")

    entry = TrainingDayExercise(day_id=day_id, order=len(day.exercises), **data.model_dump(exclude={'order'}))
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return TrainingDayExerciseResponse(
        id=entry.id,
        exercise_id=entry.exercise_id,
        exercise_name=entry.exercise.name if entry.exercise else "",
        order=entry.order,
        target_sets=entry.target_sets,
        target_reps_min=entry.target_reps_min,
        target_reps_max=entry.target_reps_max,
    )


@router.delete("/days/{day_id}/exercises/{entry_id}")
def remove_exercise_from_day(
    day_id: int,
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(TrainingDayExercise).join(TrainingDay).join(TrainingPlan).filter(
        TrainingDayExercise.id == entry_id,
        TrainingDay.id == day_id,
        TrainingPlan.user_id == current_user.id
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Eintrag nicht gefunden")
    db.delete(entry)
    db.commit()
    return {"message": "Übung entfernt"}
