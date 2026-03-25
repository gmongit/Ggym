from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from ..database import get_db
from ..models.user import User
from ..models.body_metrics import BodyMetric
from ..schemas.body_metrics import BodyMetricCreate, BodyMetricResponse
from ..auth.jwt import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])

@router.get("/body", response_model=List[BodyMetricResponse])
def get_body_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return (
        db.query(BodyMetric)
        .filter(BodyMetric.user_id == current_user.id)
        .order_by(BodyMetric.date.desc())
        .all()
    )

@router.post("/body", response_model=BodyMetricResponse)
def create_body_metric(
    metric_data: BodyMetricCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    metric = BodyMetric(
        user_id=current_user.id,
        date=metric_data.date or datetime.utcnow(),
        weight_kg=metric_data.weight_kg,
        body_fat_percent=metric_data.body_fat_percent
    )
    db.add(metric)
    db.commit()
    db.refresh(metric)
    return metric

@router.get("/body/trend")
def get_body_trend(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    since = datetime.utcnow() - timedelta(days=days)
    metrics = (
        db.query(BodyMetric)
        .filter(
            BodyMetric.user_id == current_user.id,
            BodyMetric.date >= since
        )
        .order_by(BodyMetric.date.asc())
        .all()
    )

    if len(metrics) < 2:
        return {"trend": "insufficient_data", "data": metrics}

    weights = [m.weight_kg for m in metrics]
    slope = (weights[-1] - weights[0]) / len(weights)
    trend = "gaining" if slope > 0.1 else "losing" if slope < -0.1 else "stable"

    return {
        "trend": trend,
        "slope_per_entry": round(slope, 3),
        "start_weight": weights[0],
        "current_weight": weights[-1],
        "change_kg": round(weights[-1] - weights[0], 2),
        "data": [BodyMetricResponse.model_validate(m) for m in metrics]
    }
