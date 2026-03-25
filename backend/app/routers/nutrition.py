from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from ..database import get_db
from ..models.user import User
from ..models.nutrition import NutritionLog
from ..schemas.nutrition import NutritionLogCreate, NutritionLogResponse, NutritionSummary
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/nutrition", tags=["nutrition"])

@router.get("/", response_model=List[NutritionLogResponse])
def get_nutrition_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(NutritionLog)
        .filter(NutritionLog.user_id == current_user.id)
        .order_by(NutritionLog.date.desc())
        .limit(limit)
        .all()
    )

@router.post("/", response_model=NutritionLogResponse)
def create_nutrition_log(
    log_data: NutritionLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    log = NutritionLog(
        user_id=current_user.id,
        date=log_data.date or datetime.utcnow(),
        **{k: v for k, v in log_data.model_dump().items() if k != "date"}
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

@router.get("/summary", response_model=NutritionSummary)
def get_nutrition_summary(
    date_str: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date() if date_str else date.today()

    logs = (
        db.query(NutritionLog)
        .filter(
            NutritionLog.user_id == current_user.id,
            NutritionLog.date >= datetime.combine(target_date, datetime.min.time()),
            NutritionLog.date < datetime.combine(target_date, datetime.max.time())
        )
        .all()
    )

    return NutritionSummary(
        date=str(target_date),
        total_calories=sum(l.calories for l in logs),
        total_protein_g=sum(l.protein_g for l in logs),
        total_carbs_g=sum(l.carbs_g for l in logs),
        total_fat_g=sum(l.fat_g for l in logs),
        entries=logs
    )
