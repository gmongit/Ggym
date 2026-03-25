# Phase 1 – Backend Fundament – ABGESCHLOSSEN

## Was wurde implementiert

### Projektstruktur
Vollständige Ordnerstruktur für `backend/`, `frontend/` und `ml_training/` angelegt.

### Datenbankmodelle (SQLAlchemy)
- `User` – Authentifizierung, Rollen (user/admin)
- `InviteToken` – Einladungssystem
- `Exercise` – Übungen mit MuscleGroup- und ExerciseType-Enums
- `WorkoutSession` – Trainingseinheiten mit RPE
- `Set` – einzelne Sätze mit Gewicht, Reps, RIR
- `BodyMetric` – Körpergewicht & Körperfett
- `NutritionLog` – Mahlzeiten mit Makros
- `MLPrediction` – ML-Output Logging

### Auth System
- JWT Login/Register Endpoints
- bcrypt Password Hashing
- Protected Routes via Dependency Injection
- Invite-System mit Token (7 Tage gültig)

### REST API (FastAPI)
- `POST/GET /auth/...` – Login, Register, Invite, Me
- `GET/POST/PUT/DELETE /workouts/` + Sets
- `GET/POST /exercises/` + History
- `GET/POST /metrics/body` + Trend
- `GET/POST /nutrition/` + Summary
- `GET /ml/recommendation/{id}`, Weekly Summary, Feedback

### ML Grundlage
- Feature Engineering (Epley 1RM, Trend-Berechnung, Plateau-Detection)
- Rule-Based Recommendations (Fallback ohne trainiertes Modell)
- CUSUM Plateau Detector
- LLM Coach Integration (Groq API + Template-Fallback)

### Seed-Daten
29 Standard-Übungen auf Deutsch (alle Muskelgruppen)

## Start
```bash
cd backend
source venv/Scripts/activate  # Windows
uvicorn app.main:app --reload
```

API Docs: http://localhost:8000/docs
