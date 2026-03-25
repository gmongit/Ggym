import numpy as np
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

def calculate_1rm(weight_kg: float, reps: int) -> float:
    """Epley formula"""
    if reps == 1:
        return weight_kg
    return weight_kg * (1 + reps / 30)

def get_exercise_features(db: Session, user_id: int, exercise_id: int) -> Optional[dict]:
    from ..models.workout import WorkoutSession, Set

    sessions_with_sets = (
        db.query(WorkoutSession)
        .join(Set)
        .filter(
            WorkoutSession.user_id == user_id,
            Set.exercise_id == exercise_id
        )
        .order_by(WorkoutSession.date.desc())
        .limit(12)
        .all()
    )

    if not sessions_with_sets:
        return None

    session_data = []
    for session in sessions_with_sets:
        exercise_sets = [s for s in session.sets if s.exercise_id == exercise_id]
        if not exercise_sets:
            continue

        best_set = max(exercise_sets, key=lambda s: calculate_1rm(s.weight_kg, s.reps))
        total_volume = sum(s.weight_kg * s.reps for s in exercise_sets)
        avg_rir = np.mean([s.rir for s in exercise_sets if s.rir is not None]) if any(s.rir is not None for s in exercise_sets) else None

        session_data.append({
            "date": session.date,
            "weight": best_set.weight_kg,
            "reps": best_set.reps,
            "1rm": calculate_1rm(best_set.weight_kg, best_set.reps),
            "volume": total_volume,
            "rir": avg_rir
        })

    if not session_data:
        return None

    latest = session_data[0]
    days_since = (datetime.utcnow() - latest["date"]).days

    weights = [s["1rm"] for s in session_data]
    volumes = [s["volume"] for s in session_data]

    weight_slope = 0.0
    volume_slope = 0.0
    if len(weights) >= 2:
        x = np.arange(len(weights))
        weight_slope = float(np.polyfit(x, weights, 1)[0])
        volume_slope = float(np.polyfit(x, volumes, 1)[0])

    two_weeks_ago = datetime.utcnow() - timedelta(days=14)
    sessions_last_2_weeks = sum(1 for s in session_data if s["date"] >= two_weeks_ago)

    max_1rm = max(weights)
    stagnation_weeks = 0
    for s in session_data:
        if s["1rm"] >= max_1rm * 0.99:
            break
        stagnation_weeks += 1
    stagnation_weeks = min(stagnation_weeks, 8)

    return {
        "last_weight_kg": latest["weight"],
        "last_reps": latest["reps"],
        "last_1rm_estimated": latest["1rm"],
        "weight_trend_slope": weight_slope,
        "volume_trend_slope": volume_slope,
        "sessions_last_2_weeks": sessions_last_2_weeks,
        "days_since_last_session": days_since,
        "stagnation_weeks": stagnation_weeks,
        "avg_rir_last_session": float(latest["rir"]) if latest["rir"] is not None else 2.0,
    }
