"""
Synthetische Trainingsdaten-Generierung für FitTrack AI

KONZEPT:
Wir simulieren realistische Krafttrainings-Progressionen basierend auf
etablierten Sportprinzipien. Jeder "User" hat ein Profil mit:
  - Startgewicht (abhängig von Level)
  - Progressionsrate (wie schnell er stärker wird)
  - Recovery-Fähigkeit (wie oft er trainieren kann)
  - Verletzungswahrscheinlichkeit (Pausen einbauen)

Das Modell soll später lernen: "Gegeben die letzten N Sessions –
was ist die optimale Empfehlung für die nächste?"
"""

import numpy as np
import pandas as pd
import os
from datetime import datetime, timedelta
from typing import List, Dict

np.random.seed(42)

# ─────────────────────────────────────────────
# 1. ÜBUNGSKATALOG
# Jede Übung hat typische Anfangsgewichte und Progressionsraten
# ─────────────────────────────────────────────

EXERCISES = {
    "Kniebeuge": {
        "novice_start": (40, 80),
        "intermediate_start": (80, 140),
        "advanced_start": (120, 200),
        "progression_unit": 2.5,
        "compound": True
    },
    "Bankdrücken": {
        "novice_start": (30, 60),
        "intermediate_start": (60, 100),
        "advanced_start": (90, 140),
        "progression_unit": 2.5,
        "compound": True
    },
    "Kreuzheben": {
        "novice_start": (50, 100),
        "intermediate_start": (100, 160),
        "advanced_start": (150, 220),
        "progression_unit": 5.0,
        "compound": True
    },
    "Schulterdrücken": {
        "novice_start": (20, 40),
        "intermediate_start": (40, 70),
        "advanced_start": (60, 100),
        "progression_unit": 2.5,
        "compound": True
    },
    "Klimmzüge": {
        "novice_start": (0, 10),
        "intermediate_start": (10, 30),
        "advanced_start": (25, 50),
        "progression_unit": 2.5,
        "compound": True
    },
}

# ─────────────────────────────────────────────
# 2. USER-PROFILE
# ─────────────────────────────────────────────

USER_PROFILES = {
    "novice": {
        "weight_range": (60, 100),
        "sessions_per_week": (3, 4),
        "progression_prob": 0.80,    # 80% Chance auf Fortschritt
        "deload_interval": (8, 12),  # Alle 8-12 Wochen Deload
        "injury_prob": 0.02,
        "rpe_range": (6, 9),
        "simulation_weeks": (16, 32),
    },
    "intermediate": {
        "weight_range": (65, 105),
        "sessions_per_week": (4, 5),
        "progression_prob": 0.55,
        "deload_interval": (4, 6),
        "injury_prob": 0.04,
        "rpe_range": (7, 9),
        "simulation_weeks": (24, 52),
    },
    "advanced": {
        "weight_range": (70, 110),
        "sessions_per_week": (4, 6),
        "progression_prob": 0.30,    # Nur 30% Chance – Fortschritt ist selten
        "deload_interval": (3, 5),
        "injury_prob": 0.06,
        "rpe_range": (7, 10),
        "simulation_weeks": (32, 78),
    }
}

LABEL_TO_ID = {
    "maintain": 0,
    "increase_weight": 1,
    "increase_reps": 2,
    "deload": 3,
    "volume_increase": 4,
}


# ─────────────────────────────────────────────
# 3. KERN-SIMULATION
# ─────────────────────────────────────────────

def simulate_user(user_id: int, level: str, exercise_name: str) -> List[Dict]:
    """
    Simuliert den kompletten Trainingsverlauf eines Users für eine Übung.

    Returns: Liste von Session-Dicts mit Features + Label

    Das Label leiten wir aus dem tatsächlichen Verlauf ab:
    Wenn das Gewicht in der nächsten Session gestiegen ist UND
    die Reps gehalten wurden → war "increase_weight" die richtige Wahl.
    """
    profile = USER_PROFILES[level]
    exercise = EXERCISES[exercise_name]

    # Startgewicht zufällig aus dem Level-Bereich, auf Progressions-Unit gerundet
    start_range = exercise[f"{level}_start"]
    current_weight = np.random.uniform(*start_range)
    unit = exercise["progression_unit"]
    current_weight = round(current_weight / unit) * unit

    bodyweight = np.random.uniform(*profile["weight_range"])
    target_reps = np.random.choice([5, 6, 8, 10, 12])
    sessions_per_week = np.random.randint(*profile["sessions_per_week"])
    sim_weeks = np.random.randint(*profile["simulation_weeks"])

    sessions = []
    current_date = datetime(2023, 1, 1) + timedelta(days=np.random.randint(0, 365))
    weeks_since_deload = 0
    weeks_at_same_weight = 0
    deload_interval = np.random.randint(*profile["deload_interval"])
    current_reps = target_reps

    for week in range(sim_weeks):
        # Verletzungspause?
        if np.random.random() < profile["injury_prob"]:
            pause_weeks = np.random.randint(2, 5)
            current_date += timedelta(weeks=pause_weeks)
            current_weight = round(current_weight * np.random.uniform(0.85, 0.95) / unit) * unit
            current_reps = max(target_reps - 2, 3)
            weeks_since_deload = 0
            weeks_at_same_weight = 0
            continue

        # Deload-Woche: reduziertes Gewicht, mehr Reps, Erholung
        if weeks_since_deload >= deload_interval:
            deload_weight = round(current_weight * 0.85 / unit) * unit
            sessions.append(_make_session(
                user_id, exercise_name, current_date,
                deload_weight, int(target_reps * 1.2),
                bodyweight, "deload",
                sessions_per_week * 2, 7 // sessions_per_week,
                weeks_at_same_weight, np.random.randint(5, 7), level
            ))
            current_date += timedelta(weeks=1)
            weeks_since_deload = 0
            deload_interval = np.random.randint(*profile["deload_interval"])
            continue

        for _ in range(sessions_per_week):
            # Progressionsentscheidung
            if np.random.random() < profile["progression_prob"] and weeks_at_same_weight == 0:
                if current_reps < target_reps:
                    # Schritt 1: Erst Reps aufbauen
                    label = "increase_reps"
                    current_reps = min(current_reps + 1, target_reps)
                else:
                    # Schritt 2: Wenn Reps erreicht → Gewicht hoch, Reps runter
                    label = "increase_weight"
                    current_weight += unit
                    current_reps = max(target_reps - 2, 3)
                    weeks_at_same_weight = 0
            elif weeks_at_same_weight >= 3:
                # Zu lang kein Fortschritt → mehr Volumen probieren
                label = "volume_increase"
                weeks_at_same_weight += 1
            else:
                label = "maintain"
                weeks_at_same_weight += 1
                if np.random.random() < 0.3:
                    current_reps = max(current_reps - 1, 3)

            # Noise: reales Training ist nicht perfekt
            actual_weight = current_weight + np.random.choice([-unit, 0, 0, 0, unit]) * 0.3
            actual_weight = max(actual_weight, unit)
            actual_reps = max(current_reps + np.random.randint(-1, 2), 1)
            rpe = np.random.randint(*profile["rpe_range"])

            sessions.append(_make_session(
                user_id, exercise_name, current_date,
                actual_weight, actual_reps,
                bodyweight + np.random.uniform(-1, 1),
                label, sessions_per_week * 2, 7 // sessions_per_week,
                weeks_at_same_weight, rpe, level
            ))
            current_date += timedelta(days=7 // sessions_per_week)

        weeks_since_deload += 1

    return sessions


def _make_session(
    user_id, exercise, date, weight, reps,
    bodyweight, label, sessions_2w, days_since,
    weeks_plateau, rpe, level
) -> Dict:
    """
    Epley-Formel für geschätzten 1RM: weight * (1 + reps/30)
    Beispiel: 100kg × 5 Wdh → 1RM ≈ 116.7kg

    RIR (Reps in Reserve) = 10 - RPE
    RPE 8 → 2 Reps noch möglich
    """
    estimated_1rm = weight * (1 + reps / 30)

    return {
        "user_id": user_id,
        "level": level,
        "exercise": exercise,
        "date": date.strftime("%Y-%m-%d"),
        "weight_kg": round(weight, 1),
        "reps": int(reps),
        "estimated_1rm": round(estimated_1rm, 2),
        "volume": round(weight * reps * 3, 1),  # 3 Sätze Standard
        "bodyweight_kg": round(bodyweight, 1),
        "sessions_last_2_weeks": sessions_2w,
        "days_since_last_session": days_since,
        "weeks_at_plateau": weeks_plateau,
        "rpe": rpe,
        "rir": max(0, 10 - rpe),
        "label": label,
        "label_id": LABEL_TO_ID.get(label, 0),
    }


# ─────────────────────────────────────────────
# 4. TREND-FEATURES
# Das Modell braucht nicht nur Momentaufnahmen, sondern Trends!
# ─────────────────────────────────────────────

def add_trend_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Berechnet Trend-Features über ein Fenster der letzten 4 Sessions.

    WARUM WICHTIG:
    - Slope = 0 und Plateau-Weeks = 0 → alles normal, Fortschritt möglich
    - Slope < 0 und Plateau-Weeks > 3 → Deload empfehlen
    - Slope > 0 → Gewichtsteigerung sinnvoll

    Lineare Regression auf die letzten 4 1RM-Werte gibt uns die Steigung
    (Trend). Das ist mathematisch: y = mx + b, wir wollen m (slope).
    """
    result = []

    for (user_id, exercise), group in df.groupby(["user_id", "exercise"]):
        group = group.sort_values("date").reset_index(drop=True)

        for i in range(len(group)):
            row = group.iloc[i].to_dict()
            window = group.iloc[max(0, i - 3):i + 1]

            if len(window) >= 2:
                x = np.arange(len(window))
                rm_vals = window["estimated_1rm"].values
                vol_vals = window["volume"].values

                row["weight_trend_slope"] = float(np.polyfit(x, rm_vals, 1)[0])
                row["volume_trend_slope"] = float(np.polyfit(x, vol_vals, 1)[0])
                row["recent_best_1rm"] = float(rm_vals.max())
                row["performance_std"] = float(rm_vals.std())
            else:
                row["weight_trend_slope"] = 0.0
                row["volume_trend_slope"] = 0.0
                row["recent_best_1rm"] = row["estimated_1rm"]
                row["performance_std"] = 0.0

            result.append(row)

    return pd.DataFrame(result)


# ─────────────────────────────────────────────
# 5. HAUPTPROGRAMM
# ─────────────────────────────────────────────

def generate_dataset(n_users: int = 3000, output_dir: str = None) -> pd.DataFrame:
    if output_dir is None:
        # Funktioniert egal von wo aufgerufen
        base = os.path.dirname(os.path.abspath(__file__))
        output_dir = os.path.join(base, "datasets")

    os.makedirs(output_dir, exist_ok=True)

    # 40% Novice, 40% Intermediate, 20% Advanced
    levels = (
        ["novice"] * int(n_users * 0.4) +
        ["intermediate"] * int(n_users * 0.4) +
        ["advanced"] * int(n_users * 0.2)
    )
    np.random.shuffle(levels)

    print(f"Generiere Daten fuer {n_users} User...")
    print(f"  Novice: {levels.count('novice')} | Intermediate: {levels.count('intermediate')} | Advanced: {levels.count('advanced')}")

    all_sessions = []
    for user_id, level in enumerate(levels):
        if user_id % 500 == 0:
            print(f"  User {user_id}/{n_users}...")

        # Jeder User trainiert 1-3 Übungen
        n_exercises = np.random.choice([1, 2, 3], p=[0.3, 0.4, 0.3])
        chosen = np.random.choice(list(EXERCISES.keys()), size=n_exercises, replace=False)
        for exercise in chosen:
            all_sessions.extend(simulate_user(user_id, level, exercise))

    df = pd.DataFrame(all_sessions)
    print(f"\nRohdaten: {len(df):,} Sessions")
    print(f"Label-Verteilung:\n{df['label'].value_counts().to_string()}")

    print("\nBerechne Trend-Features...")
    df = add_trend_features(df)

    path = os.path.join(output_dir, "synthetic_training_data.csv")
    df.to_csv(path, index=False)
    print(f"\nGespeichert: {path}")
    print(f"Finale Groesse: {len(df):,} Zeilen, {len(df.columns)} Spalten")

    return df


if __name__ == "__main__":
    df = generate_dataset(n_users=3000)

    print("\n=== DATENSATZ STATISTIK ===")
    print(f"Gesamt Sessions:          {len(df):,}")
    print(f"Einzigartige User:         {df['user_id'].nunique():,}")
    print(f"Avg Sessions/User:         {len(df) / df['user_id'].nunique():.1f}")
    print(f"\nLabel-Verteilung (%):")
    print((df['label'].value_counts(normalize=True) * 100).round(1).to_string())
    print(f"\nFeature-Statistik:")
    print(df[['weight_kg', 'estimated_1rm', 'weight_trend_slope', 'weeks_at_plateau']].describe().round(2).to_string())
