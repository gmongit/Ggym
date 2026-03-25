from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from ..database import get_db
from ..models.user import User
from ..models.workout import WorkoutSession, Set
from ..models.exercise import Exercise
from ..models.ml_prediction import MLPrediction
from ..schemas.ml import MLRecommendation, MLFeedback, WeeklySummary, ChatRequest, ChatResponse
from ..auth.jwt import get_current_user
from ..ml.progress_model import get_recommendation
from ..ml.llm_coach import get_llm_response, QUICK_QUESTIONS
from ..config import settings

router = APIRouter(prefix="/ml", tags=["ml"])

@router.get("/recommendation/{exercise_id}", response_model=MLRecommendation)
def get_exercise_recommendation(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    recommendation = get_recommendation(db, current_user.id, exercise_id)

    prediction = MLPrediction(
        user_id=current_user.id,
        exercise_id=exercise_id,
        recommendation=recommendation["recommendation_class"],
        confidence=recommendation["confidence"],
        model_version=recommendation["model_version"]
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    return MLRecommendation(
        exercise_id=exercise_id,
        exercise_name=exercise.name,
        **recommendation
    )

@router.get("/weekly-summary", response_model=WeeklySummary)
def get_weekly_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    week_start = datetime.utcnow() - timedelta(days=7)

    sessions = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.user_id == current_user.id,
            WorkoutSession.date >= week_start
        )
        .all()
    )

    total_volume = 0.0
    exercise_counts = {}
    exertions = []

    for session in sessions:
        if session.perceived_exertion:
            exertions.append(session.perceived_exertion)
        for s in session.sets:
            total_volume += s.weight_kg * s.reps
            exercise_counts[s.exercise_id] = exercise_counts.get(s.exercise_id, 0) + 1

    top_exercise_ids = sorted(exercise_counts, key=exercise_counts.get, reverse=True)[:3]
    top_exercises = []
    for eid in top_exercise_ids:
        ex = db.query(Exercise).filter(Exercise.id == eid).first()
        if ex:
            top_exercises.append(ex.name)

    return WeeklySummary(
        week_start=week_start.strftime("%Y-%m-%d"),
        total_sessions=len(sessions),
        total_volume_kg=round(total_volume, 1),
        top_exercises=top_exercises,
        avg_perceived_exertion=round(sum(exertions) / len(exertions), 1) if exertions else None,
        recommendations=["Gute Woche! Weiter so."] if sessions else ["Diese Woche noch kein Training aufgezeichnet."]
    )

@router.post("/chat", response_model=ChatResponse)
async def chat_with_coach(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Kontext aus DB aufbauen
    context = {}

    if request.exercise_id:
        exercise = db.query(Exercise).filter(Exercise.id == request.exercise_id).first()
        if exercise:
            context["exercise_name"] = exercise.name

        # Letzte 5 Sessions dieser Übung als lesbaren String
        from ..models.workout import WorkoutSession, Set
        recent = (
            db.query(WorkoutSession)
            .join(Set)
            .filter(
                WorkoutSession.user_id == current_user.id,
                Set.exercise_id == request.exercise_id
            )
            .order_by(WorkoutSession.date.desc())
            .limit(5)
            .all()
        )
        if recent:
            session_strings = []
            for s in reversed(recent):
                sets = [x for x in s.sets if x.exercise_id == request.exercise_id]
                if sets:
                    best = max(sets, key=lambda x: x.weight_kg * x.reps)
                    session_strings.append(
                        f"{s.date.strftime('%d.%m')}: {best.weight_kg}kg×{best.reps}"
                    )
            context["recent_sessions"] = " | ".join(session_strings)

        # ML-Empfehlung holen
        rec = get_recommendation(db, current_user.id, request.exercise_id)
        context["ml_recommendation"] = rec.get("recommendation_label", "")
        context["confidence"] = rec.get("confidence", 0)
        context["explanation"] = rec.get("explanation", "")
        context["suggested_weight_kg"] = rec.get("suggested_weight_kg")
        context["suggested_reps"] = rec.get("suggested_reps")

    # Körpergewicht-Trend
    from ..models.body_metrics import BodyMetric
    metrics = (
        db.query(BodyMetric)
        .filter(BodyMetric.user_id == current_user.id)
        .order_by(BodyMetric.date.desc())
        .limit(5)
        .all()
    )
    if len(metrics) >= 2:
        diff = metrics[0].weight_kg - metrics[-1].weight_kg
        direction = "steigend" if diff > 0.3 else "fallend" if diff < -0.3 else "stabil"
        context["weight_trend"] = f"{metrics[0].weight_kg} kg ({direction})"

    # Kalorien letzte Woche
    from ..models.nutrition import NutritionLog
    week_ago = datetime.utcnow() - timedelta(days=7)
    nutrition = db.query(NutritionLog).filter(
        NutritionLog.user_id == current_user.id,
        NutritionLog.date >= week_ago
    ).all()
    if nutrition:
        avg_cals = sum(n.calories for n in nutrition) / max(len(set(n.date.date() for n in nutrition)), 1)
        context["avg_calories"] = round(avg_cals)

    history = [{"role": m.role, "content": m.content} for m in request.chat_history]

    reply = await get_llm_response(
        user_message=request.message,
        context=context,
        chat_history=history,
        groq_api_key=settings.GROQ_API_KEY,
    )

    return ChatResponse(reply=reply, quick_questions=QUICK_QUESTIONS)


@router.post("/feedback")
def submit_feedback(
    feedback: MLFeedback,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    prediction = db.query(MLPrediction).filter(
        MLPrediction.id == feedback.prediction_id,
        MLPrediction.user_id == current_user.id
    ).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    prediction.user_feedback = feedback.rating
    db.commit()
    return {"message": "Feedback saved"}
