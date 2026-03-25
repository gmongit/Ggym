"""
Label-Generierung aus historischen Trainingsdaten.
Klassen: 0=maintain, 1=increase_weight, 2=increase_reps, 3=deload, 4=volume_increase
"""
import pandas as pd
import numpy as np


WEIGHT_INCREASE_THRESHOLD = 0.025   # >2.5% → increase_weight
REP_INCREASE_THRESHOLD = 2          # >=2 mehr Wdh bei gleichem Gewicht
PERFORMANCE_DROP_THRESHOLD = -0.05  # <-5% → deload


def epley_1rm(weight: float, reps: int) -> float:
    return weight * (1 + reps / 30) if reps > 1 else weight


def generate_labels(df: pd.DataFrame) -> pd.DataFrame:
    """
    df muss Spalten haben: user_id, exercise_id, date, weight_kg, reps, set_number
    Gibt df zurück mit zusätzlicher Spalte 'label' (int 0-4)
    """
    df = df.sort_values(["user_id", "exercise_id", "date"]).copy()
    df["1rm"] = df.apply(lambda r: epley_1rm(r["weight_kg"], r["reps"]), axis=1)

    # Bestes Set pro Session nehmen
    session_best = (
        df.groupby(["user_id", "exercise_id", "date"])["1rm"]
        .max()
        .reset_index()
    )

    labels = []
    for (user_id, exercise_id), group in session_best.groupby(["user_id", "exercise_id"]):
        group = group.sort_values("date").reset_index(drop=True)
        for i in range(1, len(group)):
            prev = group.loc[i - 1, "1rm"]
            curr = group.loc[i, "1rm"]
            pct_change = (curr - prev) / prev if prev > 0 else 0

            if pct_change >= WEIGHT_INCREASE_THRESHOLD:
                label = 1  # increase_weight
            elif pct_change >= 0.01:
                label = 2  # increase_reps
            elif pct_change <= PERFORMANCE_DROP_THRESHOLD:
                label = 3  # deload
            else:
                label = 0  # maintain

            labels.append({
                "user_id": user_id,
                "exercise_id": exercise_id,
                "date": group.loc[i, "date"],
                "1rm": curr,
                "label": label,
            })

    return pd.DataFrame(labels)


if __name__ == "__main__":
    # Beispiel-Test mit synthetischen Daten
    sample = pd.DataFrame({
        "user_id": [1] * 10,
        "exercise_id": [1] * 10,
        "date": pd.date_range("2024-01-01", periods=10, freq="3D"),
        "weight_kg": [80, 80, 82.5, 82.5, 85, 85, 85, 82.5, 80, 80],
        "reps": [5, 6, 5, 5, 4, 5, 5, 5, 5, 5],
        "set_number": [1] * 10,
    })
    result = generate_labels(sample)
    print(result)
    print("\nLabel-Verteilung:")
    print(result["label"].value_counts())
