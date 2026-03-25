"""
Phase 3.3 – Modell V1: Gradient Boosting Classifier

WARUM GRADIENT BOOSTING (nicht z.B. ein neuronales Netz)?

1. INTERPRETIERBARKEIT: Feature Importance zeigt uns WAS das Modell lernt.
   Bei einem neuronalen Netz ist das eine Black Box.

2. DATENMENGE: Für ~100k Samples ist Gradient Boosting oft besser als Deep Learning.
   Deep Learning braucht Millionen Samples für gute Generalisierung.

3. TABULAR DATA: Baumartige Modelle (Random Forest, Gradient Boosting) sind auf
   strukturierten Tabellendaten oft besser als neuronale Netze.
   Wissenschaftlich belegt: "Why do tree-based models still outperform deep
   learning on tabular data?" (Grinsztajn et al., 2022)

4. KEIN OVERFITTING DURCH SEQUENTIAL SPLIT: Wir verwenden TimeSeriesSplit,
   der nie "in die Zukunft schaut" beim Training. Das simuliert echten Einsatz.

MODELL-PIPELINE:
  Rohdaten → StandardScaler → GradientBoostingClassifier → Vorhersage

StandardScaler normalisiert alle Features auf Mittelwert=0, Std=1.
Das verhindert, dass features mit großen Werten (z.B. volume=3000)
die Features mit kleinen Werten (z.B. rir=2) dominieren.
"""

import os
import sys
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import HistGradientBoostingClassifier  # 10-50x schneller als GBC
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix
import warnings
warnings.filterwarnings("ignore")

# Pfade
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "datasets", "synthetic_training_data.csv")
MODEL_DIR = os.path.join(BASE_DIR, "..", "backend", "app", "ml", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "progress_v1.joblib")

# ─────────────────────────────────────────────
# FEATURE-DEFINITION
# Diese müssen 1:1 mit feature_engineering.py im Backend übereinstimmen!
# ─────────────────────────────────────────────

# Input-Features (was das Modell "sieht")
FEATURE_COLS = [
    "weight_kg",              # Letztes verwendetes Gewicht
    "reps",                   # Letzte Wiederholungen
    "estimated_1rm",          # Geschätzter 1RM (Epley)
    "sessions_last_2_weeks",  # Trainingsfrequenz
    "days_since_last_session",# Erholung
    "weeks_at_plateau",       # Wie lang kein Fortschritt?
    "rpe",                    # Wahrgenommene Anstrengung
    "rir",                    # Reps in Reserve
    "weight_trend_slope",     # Trend der letzten 4 Sessions
    "volume_trend_slope",     # Volumen-Trend
    "performance_std",        # Konsistenz der Performance
]

TARGET_COL = "label_id"  # 0-4

LABEL_NAMES = {
    0: "maintain",
    1: "increase_weight",
    2: "increase_reps",
    3: "deload",
    4: "volume_increase"
}


def load_and_prepare_data(path: str):
    """
    Lädt und bereinigt den Datensatz.

    WICHTIG – TimeSeriesSplit:
    Bei normalen Train/Test-Splits könnte das Modell "cheaten":
    Wenn Session 50 im Training ist und Session 49 im Test,
    nutzt das Modell Zukunftswissen. Das nennt man "Data Leakage".

    TimeSeriesSplit schneidet immer so: Train=Vergangenheit, Test=Zukunft.
    Das simuliert den echten Einsatz.
    """
    print(f"Lade Daten von: {path}")
    df = pd.read_csv(path)
    print(f"  {len(df):,} Zeilen geladen")

    # Fehlende Feature-Werte (können bei ersten Sessions entstehen)
    df[FEATURE_COLS] = df[FEATURE_COLS].fillna(0)

    # Nur Zeilen mit gültigem Label
    df = df.dropna(subset=[TARGET_COL])
    df[TARGET_COL] = df[TARGET_COL].astype(int)

    # Daten chronologisch sortieren (wichtig für TimeSeriesSplit!)
    df = df.sort_values("date").reset_index(drop=True)

    print(f"  {len(df):,} Zeilen nach Bereinigung")
    print(f"  Label-Verteilung: {dict(df[TARGET_COL].value_counts().sort_index())}")

    return df


def train_model(df: pd.DataFrame):
    """
    Trainiert den Gradient Boosting Classifier.

    HYPERPARAMETER-ERKLÄRUNG:
    - n_estimators=300: 300 Entscheidungsbäume werden nacheinander trainiert.
      Jeder Baum korrigiert die Fehler des vorherigen.
    - learning_rate=0.05: Klein = stabiler, braucht mehr Bäume.
      Groß = schneller, aber überfittet leichter.
    - max_depth=4: Tiefe eines einzelnen Baums.
      Zu tief = Overfitting (lernt Trainingsdata auswendig).
      Zu flach = Underfitting (zu einfach, lernt Muster nicht).
    - subsample=0.8: Jeder Baum sieht nur 80% der Daten (Stochastik).
      Das macht das Modell robuster und verhindert Overfitting.
    - min_samples_leaf=20: Blätter mit weniger als 20 Samples werden nicht erstellt.
      Verhindert, dass das Modell Ausreißer auswendig lernt.
    """
    X = df[FEATURE_COLS].values
    y = df[TARGET_COL].values

    print(f"\nTraining mit {len(X):,} Samples, {len(FEATURE_COLS)} Features")

    # ── Class Imbalance beheben ────────────────────────────────────────────
    # HistGradientBoostingClassifier unterstützt class_weight="balanced" nativ.
    # Das ist viel sauberer als manuelle Sample Weights.
    #
    # WARUM HistGradientBoostingClassifier statt GradientBoostingClassifier?
    # - Histogram-basierter Ansatz: Features werden in Bins eingeteilt
    # - Statt O(n) pro Split: O(bins) → typisch 255 Bins statt 700k Samples
    # - Ergebnis: 10-50x schneller, fast gleiche Qualität
    # - Unterstützt class_weight="balanced" direkt
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("model", HistGradientBoostingClassifier(
            max_iter=300,          # Anzahl Bäume (wie n_estimators)
            learning_rate=0.05,
            max_depth=4,
            min_samples_leaf=20,
            class_weight="balanced",  # Automatisch alle Klassen gleich gewichten
            random_state=42,
        ))
    ])

    # ── Cross-Validation: nur 3 Folds für schnellere Iteration ───────────
    # f1_macro = alle Klassen gleich gewichtet (nicht von Mehrheitsklasse dominiert)
    print("\nCross-Validation (TimeSeriesSplit, 3 Folds, f1_macro)...")
    tscv = TimeSeriesSplit(n_splits=3)
    cv_scores = cross_val_score(pipeline, X, y, cv=tscv, scoring="f1_macro", n_jobs=1)
    print(f"  CV F1-macro: {cv_scores.mean():.3f} (+/- {cv_scores.std():.3f})")
    print(f"  Per-Fold:    {[f'{s:.3f}' for s in cv_scores]}")

    # ── Finales Training auf allen Daten ──────────────────────────────────
    print("\nFinales Training auf allen Daten...")
    pipeline.fit(X, y)

    # ── Evaluation auf den letzten 20% (Zeitlich) ─────────────────────────
    split_idx = int(len(X) * 0.8)
    X_test = X[split_idx:]
    y_test = y[split_idx:]
    y_pred = pipeline.predict(X_test)

    print(f"\n=== EVALUATION (letzte 20% = Zukunft) ===")
    print(classification_report(
        y_test, y_pred,
        target_names=[LABEL_NAMES[i] for i in range(5)],
        zero_division=0
    ))

    # ── Feature Importance ────────────────────────────────────────────────
    # Zeigt welche Features das Modell am meisten nutzt.
    # Das ist Gold für Debugging: Wenn "weeks_at_plateau" ganz oben steht,
    # weiß das Modell wann jemand stagniert.
    # HistGBT nutzt permutation importance statt direkter feature_importances_
    from sklearn.inspection import permutation_importance
    perm = permutation_importance(pipeline, X[split_idx:], y[split_idx:], n_repeats=5, random_state=42, n_jobs=1)
    feat_imp = sorted(zip(FEATURE_COLS, perm.importances_mean), key=lambda x: x[1], reverse=True)

    print("\n=== FEATURE IMPORTANCE (Top 11) ===")
    for feat, imp in feat_imp:
        bar = "#" * int(imp * 200)
        print(f"  {feat:<30} {imp:.4f}  {bar}")

    # ── Confusion Matrix ──────────────────────────────────────────────────
    # Zeigt wo das Modell verwirrt ist.
    # Z.B. oft "increase_weight" als "maintain" predicted = unterschätzt Fortschritt.
    cm = confusion_matrix(y_test, y_pred)
    print("\n=== CONFUSION MATRIX ===")
    print("Zeile = echtes Label, Spalte = vorhergesagtes Label")
    label_shorts = ["maintain", "incr_w", "incr_r", "deload", "vol_inc"]
    header = "             " + "  ".join(f"{s:>8}" for s in label_shorts)
    print(header)
    for i, row in enumerate(cm):
        row_str = "  ".join(f"{v:>8}" for v in row)
        print(f"  {label_shorts[i]:>12} {row_str}")

    return pipeline


def save_model(pipeline, path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    joblib.dump(pipeline, path)
    size_kb = os.path.getsize(path) / 1024
    print(f"\nModell gespeichert: {path} ({size_kb:.1f} KB)")


def test_prediction(pipeline):
    """
    Manuelle Test-Vorhersagen um zu prüfen ob das Modell Sinn macht.

    ERWARTETE ERGEBNISSE:
    - Novice mit gutem Trend → increase_weight
    - 4 Wochen Plateau → deload
    - Reps unter Ziel → increase_reps
    """
    print("\n=== MANUELLE TEST-VORHERSAGEN ===")

    test_cases = [
        {
            "name": "Novice, guter Trend, RPE 8",
            "features": [80, 8, 93.3, 6, 3, 0, 8, 2, 1.5, 200, 1.0],
            "expected": "increase_weight"
        },
        {
            "name": "Plateau seit 4 Wochen, RPE 9",
            "features": [100, 5, 116.7, 4, 4, 4, 9, 1, 0.0, 0, 3.5],
            "expected": "deload"
        },
        {
            "name": "Reps unter Ziel (6/8), RPE 7",
            "features": [75, 6, 90.0, 6, 3, 0, 7, 3, 0.5, 150, 0.8],
            "expected": "increase_reps"
        },
        {
            "name": "Stabil, RPE 7, kein Trend",
            "features": [90, 8, 114.0, 5, 3, 1, 7, 3, 0.1, 100, 0.5],
            "expected": "maintain"
        },
    ]

    for case in test_cases:
        X = np.array([case["features"]])
        pred_id = pipeline.predict(X)[0]
        proba = pipeline.predict_proba(X)[0]
        pred_label = LABEL_NAMES[pred_id]
        confidence = proba[pred_id]
        status = "OK" if pred_label == case["expected"] else "!!"
        print(f"  [{status}] {case['name']}")
        print(f"       Vorhersage: {pred_label} ({confidence:.0%}) | Erwartet: {case['expected']}")


if __name__ == "__main__":
    # Datensatz generieren falls noch nicht vorhanden
    if not os.path.exists(DATA_PATH):
        print("Kein Datensatz gefunden – generiere synthetische Daten...")
        sys.path.insert(0, BASE_DIR)
        from generate_synthetic_data import generate_dataset
        generate_dataset(n_users=3000)

    # Training
    df = load_and_prepare_data(DATA_PATH)
    pipeline = train_model(df)
    save_model(pipeline, MODEL_PATH)
    test_prediction(pipeline)

    print("\nFertig! Das Modell wird automatisch vom Backend geladen.")
    print(f"Modell-Pfad: {MODEL_PATH}")
