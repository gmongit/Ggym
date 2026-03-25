"""Seed the database with standard exercises."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import Exercise
from app.models.exercise import MuscleGroup, ExerciseType

Base.metadata.create_all(bind=engine)

EXERCISES = [
    # Chest
    ("Bankdrücken", MuscleGroup.chest, ExerciseType.compound),
    ("Schrägbankdrücken", MuscleGroup.chest, ExerciseType.compound),
    ("Kurzhantel Flyes", MuscleGroup.chest, ExerciseType.isolation),
    ("Kabelflyes", MuscleGroup.chest, ExerciseType.isolation),
    ("Low-to-High Flyes (obere Brust)", MuscleGroup.chest, ExerciseType.isolation),
    ("High-to-Low Flyes (untere Brust)", MuscleGroup.chest, ExerciseType.isolation),
    ("Dumbbell Pullover", MuscleGroup.chest, ExerciseType.isolation),
    # Back
    ("Kreuzheben", MuscleGroup.back, ExerciseType.compound),
    ("Klimmzüge", MuscleGroup.back, ExerciseType.compound),
    ("Rudern Langhantel", MuscleGroup.back, ExerciseType.compound),
    ("T-Bar Rudern", MuscleGroup.back, ExerciseType.compound),
    ("Latzug", MuscleGroup.back, ExerciseType.compound),
    ("Kabelrudern", MuscleGroup.back, ExerciseType.isolation),
    ("Einarm Kurzhantelrudern", MuscleGroup.back, ExerciseType.compound),
    ("Rückenstrecker", MuscleGroup.back, ExerciseType.isolation),
    # Shoulders
    ("Schulterdrücken", MuscleGroup.shoulders, ExerciseType.compound),
    ("Seitheben", MuscleGroup.shoulders, ExerciseType.isolation),
    ("Frontheben", MuscleGroup.shoulders, ExerciseType.isolation),
    ("Face Pulls", MuscleGroup.shoulders, ExerciseType.isolation),
    ("Reverse Flyes (hintere Schulter)", MuscleGroup.shoulders, ExerciseType.isolation),
    ("Kurzhantel Shrugs", MuscleGroup.shoulders, ExerciseType.isolation),
    ("Langhantel Shrugs", MuscleGroup.shoulders, ExerciseType.isolation),
    # Biceps
    ("Bizepscurl Langhantel", MuscleGroup.biceps, ExerciseType.isolation),
    ("Hammercurl", MuscleGroup.biceps, ExerciseType.isolation),
    ("Konzentrationscurl", MuscleGroup.biceps, ExerciseType.isolation),
    ("Maschinencurl", MuscleGroup.biceps, ExerciseType.isolation),
    ("Bayesian Curl", MuscleGroup.biceps, ExerciseType.isolation),
    ("Schrägbankbizepscurl", MuscleGroup.biceps, ExerciseType.isolation),
    # Triceps
    ("Trizepsdrücken Kabel", MuscleGroup.triceps, ExerciseType.isolation),
    ("Skull Crushers", MuscleGroup.triceps, ExerciseType.isolation),
    ("Dips", MuscleGroup.triceps, ExerciseType.compound),
    ("Trizeps Extensions Kurzhantel", MuscleGroup.triceps, ExerciseType.isolation),
    ("Overhead Trizeps Extension", MuscleGroup.triceps, ExerciseType.isolation),
    # Legs
    ("Kniebeuge", MuscleGroup.legs, ExerciseType.compound),
    ("Beinpresse", MuscleGroup.legs, ExerciseType.compound),
    ("Rumänisches Kreuzheben", MuscleGroup.legs, ExerciseType.compound),
    ("Beinstrecker", MuscleGroup.legs, ExerciseType.isolation),
    ("Beinbeuger", MuscleGroup.legs, ExerciseType.isolation),
    ("Wadenheben", MuscleGroup.legs, ExerciseType.isolation),
    ("Bulgarische Kniebeuge", MuscleGroup.legs, ExerciseType.compound),
    ("Ausfallschritte", MuscleGroup.legs, ExerciseType.compound),
    ("Hip Thrust", MuscleGroup.legs, ExerciseType.isolation),
    # Core
    ("Plank", MuscleGroup.core, ExerciseType.isolation),
    ("Crunch", MuscleGroup.core, ExerciseType.isolation),
    ("Russian Twist", MuscleGroup.core, ExerciseType.isolation),
    ("Ab Wheel", MuscleGroup.core, ExerciseType.isolation),
    ("Beinheben", MuscleGroup.core, ExerciseType.isolation),
    ("Cable Crunch", MuscleGroup.core, ExerciseType.isolation),
]

def seed():
    db = SessionLocal()
    try:
        existing_names = {e.name for e in db.query(Exercise.name).all()}
        added = 0
        for name, muscle_group, exercise_type in EXERCISES:
            if name not in existing_names:
                db.add(Exercise(name=name, muscle_group=muscle_group, exercise_type=exercise_type, created_by=None))
                added += 1

        db.commit()
        if added:
            print(f"✓ {added} neue Übungen eingefügt.")
        else:
            print("Alle Übungen sind bereits vorhanden.")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
