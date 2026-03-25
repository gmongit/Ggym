"""
Erstellt das Fine-Tuning-Dataset im Alpaca-Format.
Quellen: synthetische Daten + (später) echte App-Daten
"""
import json
import random
from typing import Any


EXERCISES_DE = [
    "Bankdrücken", "Kniebeuge", "Kreuzheben", "Schulterdrücken",
    "Klimmzug", "Bizeps Curl", "Trizeps Pushdown", "Beinpresse",
]

RECOMMENDATION_TEMPLATES = {
    "increase_weight": [
        "Erhöhe das Gewicht um 2.5kg. Dein Körper ist bereit für mehr.",
        "Steigere das Gewicht auf {new_weight}kg. Dein Trend zeigt klar nach oben.",
        "Zeit für die nächste Stufe: {new_weight}kg × {reps} Wdh als Ziel setzen.",
    ],
    "increase_reps": [
        "Halte {weight}kg und versuche {target_reps} Wiederholungen zu schaffen.",
        "Fokussiere dich auf saubere Technik und steigere die Wdh auf {target_reps}.",
    ],
    "deload": [
        "Reduziere auf {deload_weight}kg für eine Erholungswoche. Qualität vor Quantität.",
        "Dein Körper braucht Erholung. Eine Woche mit {deload_weight}kg wird dir helfen, danach stärker zurückzukommen.",
    ],
    "maintain": [
        "Bleib bei {weight}kg × {reps} Wdh und fokussiere dich auf konstante Ausführung.",
        "Konsistenz ist jetzt wichtiger als Progression. Halte das aktuelle Niveau.",
    ],
}


def generate_sample(exercise: str, recommendation: str) -> dict[str, Any]:
    weight = random.choice([60, 70, 80, 90, 100, 110, 120, 140])
    reps = random.randint(4, 8)
    sessions = [
        f"{weight - random.randint(0,5)}x{reps}",
        f"{weight}x{reps - 1}",
        f"{weight}x{reps}",
        f"{weight}x{reps}",
    ]
    new_weight = weight + 2.5
    deload_weight = round(weight * 0.9 / 2.5) * 2.5
    target_reps = reps + 2

    template = random.choice(RECOMMENDATION_TEMPLATES[recommendation])
    output = template.format(
        weight=weight, reps=reps, new_weight=new_weight,
        deload_weight=deload_weight, target_reps=target_reps,
    )

    return {
        "instruction": "Analysiere folgende Trainingsdaten und gib eine Empfehlung",
        "input": (
            f"Übung: {exercise}\n"
            f"Letzte Sessions: {', '.join(sessions)}\n"
            f"Körpergewicht: {random.randint(70, 100)}kg (stabil)\n"
            f"Kalorien: {random.randint(2200, 3200)} kcal/Tag\n"
            f"ML-Empfehlung: {recommendation}"
        ),
        "output": output,
    }


def create_dataset(
    n_samples: int = 2000,
    output_path: str = "ml_training/datasets/finetuning_dataset.json",
):
    samples = []
    recs = ["increase_weight", "increase_reps", "deload", "maintain"]

    for _ in range(n_samples):
        exercise = random.choice(EXERCISES_DE)
        recommendation = random.choice(recs)
        samples.append(generate_sample(exercise, recommendation))

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(samples, f, ensure_ascii=False, indent=2)

    print(f"Dataset erstellt: {output_path} ({len(samples)} Beispiele)")
    return samples


if __name__ == "__main__":
    import os
    os.makedirs("ml_training/datasets", exist_ok=True)
    create_dataset()
