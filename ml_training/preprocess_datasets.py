"""
Preprocessing Pipeline für externe Kaggle-Datasets.
Erwartet Rohdaten in ml_training/datasets/raw/
"""
import os
import pandas as pd
import numpy as np


def preprocess_gym_members(input_path: str, output_path: str):
    """
    Kaggle: 'Gym Members Exercise Dataset'
    Erwartet Spalten: Age, Gender, Weight (kg), BMI, Workout_Type, etc.
    """
    df = pd.read_csv(input_path)
    print(f"Gym Members Dataset: {len(df)} Zeilen, Spalten: {list(df.columns)}")

    # Standardisierte Ausgabe
    processed = pd.DataFrame()
    col_map = {
        "Weight (kg)": "bodyweight_kg",
        "BMI": "bmi",
        "Workout_Type": "exercise_type",
        "Session_Duration (hours)": "duration_hours",
        "Calories_Burned": "calories_burned",
    }
    for src, dst in col_map.items():
        if src in df.columns:
            processed[dst] = df[src]

    processed.dropna().to_parquet(output_path, index=False)
    print(f"Verarbeitet: {output_path} ({len(processed)} Zeilen)")


def preprocess_weightlifting(input_path: str, output_path: str):
    """
    Kaggle: 'Weight Lifting Exercise Dataset'
    Angepasst je nach tatsächlicher Spaltenstruktur des Datasets.
    """
    df = pd.read_csv(input_path)
    print(f"Weightlifting Dataset: {len(df)} Zeilen, Spalten: {list(df.columns)}")

    # Generische Verarbeitung – Spalten normalisieren
    df.columns = [c.lower().replace(" ", "_") for c in df.columns]
    df.to_parquet(output_path, index=False)
    print(f"Verarbeitet: {output_path} ({len(df)} Zeilen)")


def run_all():
    raw_dir = "ml_training/datasets/raw"
    processed_dir = "ml_training/datasets/processed"
    os.makedirs(processed_dir, exist_ok=True)

    files = {
        "gym_members.csv": ("gym_members", preprocess_gym_members),
        "weightlifting.csv": ("weightlifting", preprocess_weightlifting),
    }

    for filename, (name, fn) in files.items():
        input_path = os.path.join(raw_dir, filename)
        output_path = os.path.join(processed_dir, f"{name}.parquet")
        if os.path.exists(input_path):
            print(f"\nVerarbeite {filename}...")
            fn(input_path, output_path)
        else:
            print(f"Nicht gefunden (bitte von Kaggle herunterladen): {input_path}")


if __name__ == "__main__":
    run_all()
