import os
import joblib
import numpy as np
from typing import Optional
from sqlalchemy.orm import Session
from .feature_engineering import get_exercise_features

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "progress_v1.joblib")

_model = None
MODEL_VERSION = "rule_based_v1"

RECOMMENDATION_LABELS = {
    0: "Gewicht halten",
    1: "Gewicht erhöhen",
    2: "Wiederholungen erhöhen",
    3: "Deload – Gewicht reduzieren",
    4: "Volumen erhöhen (mehr Sätze)"
}

RECOMMENDATION_CLASSES = {
    0: "maintain",
    1: "increase_weight",
    2: "increase_reps",
    3: "deload",
    4: "volume_increase"
}

def load_model():
    global _model
    if os.path.exists(MODEL_PATH):
        _model = joblib.load(MODEL_PATH)

def rule_based_recommendation(features: dict) -> dict:
    """Fallback wenn kein ML-Modell vorhanden"""
    days_since = features.get("days_since_last_session", 0)
    stagnation = features.get("stagnation_weeks", 0)
    slope = features.get("weight_trend_slope", 0)
    rir = features.get("avg_rir_last_session", 2)
    last_reps = features.get("last_reps", 8)

    if stagnation >= 3:
        rec_class = 3  # deload
        confidence = 0.75
        explanation = f"Du stagnierst seit {stagnation} Wochen. Ein Deload wird dir helfen, dich zu erholen und danach stärker zurückzukommen."
    elif rir is not None and rir >= 3 and last_reps < 12:
        rec_class = 2  # increase_reps
        confidence = 0.70
        explanation = f"Du hast noch {rir:.1f} Wiederholungen in Reserve. Erhöhe zunächst die Wiederholungen, bevor du das Gewicht steigerst."
    elif slope > 0 and stagnation == 0 and last_reps >= 8:
        rec_class = 1  # increase_weight
        confidence = 0.80
        explanation = f"Dein Trend ist positiv (Slope: {slope:.2f}). Du bist bereit für mehr Gewicht."
    elif days_since > 14:
        rec_class = 0  # maintain
        confidence = 0.65
        explanation = f"Du hast {days_since} Tage nicht trainiert. Starte mit dem bisherigen Gewicht und steigere dich dann."
    else:
        rec_class = 0  # maintain
        confidence = 0.60
        explanation = "Halte das aktuelle Gewicht und fokussiere dich auf saubere Ausführung."

    suggested_weight = features.get("last_weight_kg", 0)
    if rec_class == 1:
        suggested_weight = round(suggested_weight + 2.5, 1)
    elif rec_class == 3:
        suggested_weight = round(suggested_weight * 0.9, 1)

    return {
        "recommendation_class": RECOMMENDATION_CLASSES[rec_class],
        "recommendation_label": RECOMMENDATION_LABELS[rec_class],
        "confidence": confidence,
        "suggested_weight_kg": suggested_weight,
        "suggested_reps": int(features.get("last_reps", 8)),
        "explanation": explanation,
        "model_version": MODEL_VERSION
    }

def get_recommendation(db: Session, user_id: int, exercise_id: int) -> dict:
    features = get_exercise_features(db, user_id, exercise_id)

    if features is None:
        return {
            "recommendation_class": "maintain",
            "recommendation_label": "Erste Session – starte leicht",
            "confidence": 1.0,
            "suggested_weight_kg": None,
            "suggested_reps": 10,
            "explanation": "Noch keine Trainingsdaten vorhanden. Starte mit einem leichten Gewicht, das du sicher 10 Mal heben kannst.",
            "model_version": MODEL_VERSION
        }

    if _model is not None:
        try:
            # Reihenfolge muss exakt mit FEATURE_COLS in train_progress_model.py übereinstimmen:
            # weight_kg, reps, estimated_1rm, sessions_last_2_weeks, days_since_last_session,
            # weeks_at_plateau, rpe, rir, weight_trend_slope, volume_trend_slope, performance_std
            avg_rpe = 10 - features.get("avg_rir_last_session", 2)  # RPE aus RIR ableiten
            feature_array = np.array([[
                features["last_weight_kg"],
                features["last_reps"],
                features["last_1rm_estimated"],
                features["sessions_last_2_weeks"],
                features["days_since_last_session"],
                features["stagnation_weeks"],        # = weeks_at_plateau
                avg_rpe,
                features["avg_rir_last_session"],    # = rir
                features["weight_trend_slope"],
                features["volume_trend_slope"],
                0.0,                                 # performance_std (nicht in feature_engineering, default 0)
            ]])
            pred_class = int(_model.predict(feature_array)[0])
            confidence = float(_model.predict_proba(feature_array)[0][pred_class])
            return {
                "recommendation_class": RECOMMENDATION_CLASSES.get(pred_class, "maintain"),
                "recommendation_label": RECOMMENDATION_LABELS.get(pred_class, "Halten"),
                "confidence": confidence,
                "suggested_weight_kg": features["last_weight_kg"],
                "suggested_reps": int(features["last_reps"]),
                "explanation": f"ML-Modell Empfehlung mit {confidence:.0%} Konfidenz.",
                "model_version": "ml_v1"
            }
        except Exception:
            pass

    return rule_based_recommendation(features)

load_model()
