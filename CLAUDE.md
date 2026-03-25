# FitTrack AI – Claude Code Projektplan

## Projektübersicht
Fitness-Tracking PWA mit ML-getriebenem Progress-Coaching.  
Multi-User fähig, Freunde können eingeladen werden und tragen ebenfalls zu den ML-Trainingsdaten bei.

**Stack:**
- Frontend: React (Vite) + Tailwind CSS – als PWA deploybar, iOS-ähnliches Design
- Backend: Python (FastAPI) + SQLAlchemy + SQLite (dev) / PostgreSQL (prod)
- ML: scikit-learn → PyTorch LSTM → LLM Fine-Tuning (Mistral 7B / LLaMA 3.2)
- Hosting: Render (Backend) + Vercel (Frontend)
- Auth: JWT (jose + bcrypt)

---

## Arbeitsanweisung für Claude Code

Arbeite Phase für Phase. Schließe jede Phase vollständig ab bevor du zur nächsten gehst.  
Erstelle nach jeder Phase eine kurze `DONE_PHASE_X.md` Zusammenfassung was implementiert wurde.  
Schreibe immer vollständigen, lauffähigen Code – keine Platzhalter.

---

## Phase 1 – Backend Fundament (Woche 1–2)

### 1.1 Projektstruktur anlegen
```
fittrack/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── exercise.py
│   │   │   ├── workout.py
│   │   │   ├── nutrition.py
│   │   │   └── body_metrics.py
│   │   ├── schemas/
│   │   │   └── (Pydantic schemas für alle Models)
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── exercises.py
│   │   │   ├── workouts.py
│   │   │   ├── nutrition.py
│   │   │   ├── body_metrics.py
│   │   │   └── ml.py
│   │   ├── auth/
│   │   │   └── jwt.py
│   │   └── ml/
│   │       ├── progress_model.py
│   │       ├── plateau_detector.py
│   │       └── llm_coach.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   └── (Vite React App)
└── ml_training/
    ├── datasets/
    ├── train_progress_model.py
    ├── train_lstm.py
    └── finetune_llm.py
```

### 1.2 Datenbankmodell implementieren

Erstelle folgende SQLAlchemy Models:

**User:**
- id, email, username, hashed_password, created_at
- is_active, role (user/admin)

**Exercise:**
- id, name, muscle_group (enum: chest/back/shoulders/biceps/triceps/legs/core)
- exercise_type (enum: compound/isolation)
- created_by (user_id, null = global)

**WorkoutSession:**
- id, user_id, date, duration_minutes, notes
- perceived_exertion (1-10)

**Set:**
- id, session_id, exercise_id
- weight_kg (float), reps (int)
- rir (reps in reserve, optional int 0-4)
- set_number (int)

**BodyMetric:**
- id, user_id, date, weight_kg, body_fat_percent (optional)

**NutritionLog:**
- id, user_id, date
- calories, protein_g, carbs_g, fat_g
- food_name (string), meal_type (enum: breakfast/lunch/dinner/snack)

**MLPrediction:** (für Logging der Modelloutputs)
- id, user_id, exercise_id, created_at
- recommendation (string), confidence (float)
- model_version (string)

### 1.3 Auth System
- JWT Login/Register Endpoints
- Password hashing mit bcrypt
- Protected routes via Dependency Injection
- Invite-System: User kann Freunde per Email-Link einladen (InviteToken Model)

### 1.4 REST API Endpoints

Auth:
- POST /auth/register
- POST /auth/login
- POST /auth/invite (generiert Einladungslink)
- POST /auth/accept-invite/{token}

Workouts:
- GET/POST /workouts/
- GET/PUT/DELETE /workouts/{id}
- POST /workouts/{id}/sets
- GET /workouts/history?exercise_id=&limit=

Exercises:
- GET /exercises/ (global + eigene)
- POST /exercises/
- GET /exercises/{id}/history (alle Sets für diese Übung)

Body Metrics:
- GET/POST /metrics/body
- GET /metrics/body/trend?days=30

Nutrition:
- GET/POST /nutrition/
- GET /nutrition/summary?date=

ML:
- GET /ml/recommendation/{exercise_id}
- GET /ml/weekly-summary
- POST /ml/feedback (User bewertet Empfehlung)

### 1.5 Dependencies (requirements.txt)
```
fastapi==0.111.0
uvicorn[standard]==0.30.0
sqlalchemy==2.0.30
alembic==1.13.1
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.9
pydantic[email]==2.7.1
pydantic-settings==2.3.0
httpx==0.27.0
scikit-learn==1.5.0
pandas==2.2.2
numpy==1.26.4
torch==2.3.0
joblib==1.4.2
python-dotenv==1.0.1
```

---

## Phase 2 – Frontend PWA (Woche 3–4)

### 2.1 Vite + React Setup
```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom axios react-query
npm install recharts
npm install vite-plugin-pwa
```

### 2.2 PWA Konfiguration
- vite.config.js mit vite-plugin-pwa konfigurieren
- manifest.json: name, icons, theme_color (iOS-ähnlich: #007AFF)
- Service Worker für Offline-Caching der letzten Workouts

### 2.3 Design System
iOS-ähnliches Design mit Tailwind:
- Primärfarbe: #007AFF (iOS Blau)
- Hintergrund: #F2F2F7 (iOS Grau)
- Cards: weiß, rounded-2xl, shadow-sm
- Bottom Navigation Bar (5 Tabs)
- Haptic-ähnliches Feedback über CSS transitions

### 2.4 Screens implementieren

**Bottom Navigation:**
1. 🏋️ Training (Hauptscreen)
2. 📊 Progress (Charts)  
3. 🤖 Coach (ML Empfehlungen)
4. 🍎 Ernährung
5. 👤 Profil

**Training Screen:**
- "Training starten" Button → neue Session
- Übung hinzufügen (Suche/Filter nach Muskelgruppe)
- Set eingeben: Gewicht + Wiederholungen (große Inputs, Numpad-optimiert)
- Vorheriges Gewicht als Hint anzeigen
- Training beenden → Zusammenfassung

**Progress Screen:**
- Übung auswählen → Line Chart (1RM Entwicklung über Zeit)
- Körpergewicht Chart
- Volumen pro Woche Chart
- Alle Charts mit Recharts

**Coach Screen:**
- ML Empfehlung pro Übung (Card mit Erklärung)
- Wöchentliche Zusammenfassung
- Chat-Interface für LLM Coach (Phase 4)

**Ernährung Screen:**
- Tagesübersicht: Kalorien-Ring, Makros
- Mahlzeit hinzufügen (Open Food Facts API Integration)
- Manuelle Eingabe möglich

**Profil Screen:**
- Körpergewicht eintragen
- Freunde einladen (Einladungslink generieren)
- Einstellungen

### 2.5 API Integration
- Axios instance mit JWT interceptor
- React Query für Caching und Refetching
- Offline-first: Workouts lokal in IndexedDB speichern, sync wenn online

---

## Phase 3 – ML Progress Model (Woche 5–8)

### 3.1 Feature Engineering

Erstelle `backend/app/ml/feature_engineering.py`:

Für jede Übung pro User berechnen:
```python
features = {
    # Letztes Training
    "last_weight_kg": float,
    "last_reps": float,
    "last_1rm_estimated": float,  # Epley Formel: w * (1 + r/30)
    
    # Trend (letzte 4 Sessions)
    "weight_trend_slope": float,     # lineare Regression
    "volume_trend_slope": float,     # Volumen = sets * reps * weight
    "sessions_last_2_weeks": int,
    "days_since_last_session": int,
    
    # Plateau Detection
    "stagnation_weeks": int,         # wie lange kein Fortschritt
    "pr_weeks_ago": int,             # wann war letzter PR
    
    # Kontext
    "avg_bodyweight_last_week": float,
    "avg_calories_last_week": float,
    "avg_sleep_score": float,        # falls User einträgt
    "avg_rir_last_session": float,
}
```

### 3.2 Label-Generierung (für supervised learning)

Erstelle `ml_training/generate_labels.py`:

Aus historischen Daten automatisch Labels generieren:
- Wenn Gewicht in nächster Session gestiegen + Reps gehalten → Label: "increase_weight"
- Wenn Reps gestiegen bei gleichem Gewicht → Label: "increase_reps"  
- Wenn Performance gefallen → Label: "deload" oder "maintain"
- Schwellenwerte definieren (z.B. >2.5% Gewichtszunahme = increase)

### 3.3 Modell V1 – Random Forest (scikit-learn)

Erstelle `ml_training/train_progress_model.py`:

```python
# Klassen:
# 0: maintain (Gewicht halten)
# 1: increase_weight (Gewicht erhöhen, +2.5kg oder +5kg)
# 2: increase_reps (mehr Wdh bei gleichem Gewicht)
# 3: deload (Gewicht reduzieren, Erholung)
# 4: volume_increase (mehr Sätze)

from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import TimeSeriesSplit  # wichtig: keine Datenlecks!

# TimeSeriesSplit verwenden weil zeitliche Daten!
# Feature Importance ausgeben für Interpretierbarkeit
# Modell als joblib speichern: models/progress_v1.joblib
```

### 3.4 Plateau Detector

Erstelle `backend/app/ml/plateau_detector.py`:
- Sliding window über letzte 6 Sessions
- CUSUM (Cumulative Sum) Algorithmus für Trend-Change-Detection
- Output: plateau_probability (0-1), weeks_stagnating (int)

### 3.5 Modell V2 – LSTM (Phase 2 des ML)

Erstelle `ml_training/train_lstm.py`:

```python
# Input: Sequenz der letzten 12 Sessions (padded)
# Features pro Session: [weight, reps, 1rm, volume, days_gap, bodyweight]
# Output: nächster empfohlener 1RM + Klasse

import torch
import torch.nn as nn

class ProgressLSTM(nn.Module):
    def __init__(self, input_size=6, hidden_size=64, num_layers=2, num_classes=5):
        # Bidirektionales LSTM
        # Dropout 0.3
        # Linear output layer
        pass
```

### 3.6 Synthetic Data Generation

Erstelle `ml_training/generate_synthetic_data.py`:

Da eigene Daten am Anfang begrenzt sind, synthetische Progressionskurven generieren:
- Novice Lifter (lineare Progression, +2.5kg alle 1-2 Sessions)
- Intermediate (Wellenbewegung, Plateaus alle 4-6 Wochen)
- Advanced (sehr langsame Progression, häufige Deloads)
- Verschiedene Übungen (Squat, Bench, Deadlift, OHP, etc.)
- Noise hinzufügen (schlechte Tage, Verletzungspausen, etc.)
- Ziel: 10.000 synthetische User-Historien

### 3.7 Externe Datasets

Lade folgende Datasets herunter und verarbeite sie:
- Kaggle "Gym Members Exercise Dataset" 
- Kaggle "Weight Lifting Exercise Dataset"
- Speichere in `ml_training/datasets/raw/`
- Preprocessing Pipeline in `ml_training/preprocess_datasets.py`

### 3.8 ML Endpoint integrieren

In `backend/app/routers/ml.py`:
- Beim Request: Features für User+Übung aus DB berechnen
- Modell laden (cached, nicht bei jedem Request neu laden)
- Recommendation zurückgeben mit Confidence Score
- Prediction in MLPrediction Tabelle loggen (für späteres Fine-Tuning)

---

## Phase 4 – LLM Coach (Woche 9–12)

### 4.1 Strategie

**Schritt 1 (sofort):** Mistral 7B / LLaMA 3.2 über Ollama lokal + System-Prompt  
**Schritt 2 (nach 2-3 Monaten Daten):** QLoRA Fine-Tuning auf Google Colab

### 4.2 LLM Integration (Schritt 1)

Erstelle `backend/app/ml/llm_coach.py`:

```python
# Ollama API (lokal) ODER Groq API (kostenlos, cloud)
# Groq: llama-3.1-8b-instant ist kostenlos und schnell
# Fallback: wenn kein LLM verfügbar, template-basierte Antworten

SYSTEM_PROMPT = """
Du bist ein erfahrener Krafttraining-Coach mit Fokus auf evidenzbasiertem Training.
Du analysierst Trainingsdaten und gibst konkrete, praktische Empfehlungen.
Antworte auf Deutsch, präzise und motivierend.
Verwende keine generischen Phrasen. Beziehe dich immer auf die konkreten Zahlen.
"""

# Kontext für jeden Request:
# - ML-Modell Recommendation (Klasse + Confidence)
# - Letzte 4 Sessions der Übung
# - Körpergewicht-Trend
# - Kalorien der letzten Woche
# - User-Frage (optional)
```

### 4.3 Fine-Tuning Dataset erstellen

Erstelle `ml_training/create_finetuning_dataset.py`:

Format (Alpaca-Style):
```json
{
  "instruction": "Analysiere folgende Trainingsdaten und gib eine Empfehlung",
  "input": "Übung: Bankdrücken\nLetzte Sessions: 80x5, 80x5, 82.5x4, 82.5x5\nKörpergewicht: stabil bei 82kg\nKalorien: 2800 kcal/Tag (leichter Überschuss)",
  "output": "Dein Bankdrücken zeigt einen positiven Trend..."
}
```

Quellen für Dataset:
1. Reddit r/weightroom, r/StartingStrength API dumps (pushshift)
2. Synthetisch generiert mit GPT-4 API (Prompt-Template miterstellen)
3. Aus eigenen App-Daten: ML-Output + manuelle Coach-Bewertung

### 4.4 Fine-Tuning Script

Erstelle `ml_training/finetune_llm.py`:

```python
# Verwendete Libraries:
# pip install transformers peft datasets trl bitsandbytes

# Basis-Modell: mistralai/Mistral-7B-Instruct-v0.3
# Methode: QLoRA (4-bit quantization + LoRA)
# Training: Google Colab T4 GPU (kostenlos)
# Trainingszeit: ~2-4 Stunden für 1000 Beispiele

# LoRA Config:
# r=16, alpha=32, dropout=0.05
# Target modules: q_proj, v_proj

# Nach Training: Modell auf HuggingFace Hub hochladen (private repo)
```

### 4.5 Chat Interface im Frontend

Coach Screen erweitern:
- Chat-UI (Nachrichten-Bubbles)
- User kann Fragen stellen: "Warum soll ich das Gewicht erhöhen?"
- Kontext wird automatisch mitgesendet
- Streaming Response (token by token)
- Vorgefertigte Quick-Questions als Chips

---

## Phase 5 – Integration & Deployment (Woche 13–14)

### 5.1 Multi-User Datenschutz
- ML-Modell trainiert auf aggregierten, anonymisierten Daten
- Jeder User sieht nur seine eigenen Daten
- Admin-Dashboard (nur für dich): aggregierte Statistiken, Model-Performance

### 5.2 Backend Deployment (Render)
- `render.yaml` erstellen
- PostgreSQL statt SQLite in Production
- Alembic Migrations
- Environment Variables über Render Dashboard
- Health-Check Endpoint: GET /health

### 5.3 Frontend Deployment (Vercel)
- `vercel.json` erstellen
- Environment Variable: VITE_API_URL
- PWA Icons generieren (alle Größen für iOS)
- iOS-spezifische Meta-Tags:
  ```html
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  ```

### 5.4 App an Freunde teilen
- Freunde öffnen URL in Safari auf iPhone
- "Teilen" → "Zum Home-Bildschirm" → fertig
- Onboarding Screen der genau das erklärt (mit Screenshots/Animation)
- Einladungsflow: Du generierst Link → Freund registriert sich → sieht sofort leeres Dashboard

### 5.5 Push Notifications (optional)
- Web Push API für PWA
- Notifications:
  - "Zeit für Training?" (basierend auf Trainingsrhythmus)
  - "Dein Deload ist überfällig"
  - "Neuer PR! 🎉"

---

## Wichtige Implementierungshinweise

### Datenqualität für ML
- Jede Aktion des Users in einem `event_log` mitloggen
- ML-Predictions immer versioniert speichern
- User-Feedback zu Empfehlungen tracken (war die Empfehlung hilfreich?)
- Diese Daten sind Gold für späteres Fine-Tuning

### Performance
- ML-Modell beim Start laden, nicht bei jedem Request
- Berechnungsintensive Features cachen (Redis oder einfaches in-memory Dict)
- React Query mit 5min stale time für ML-Recommendations

### Testing
- Für jedes ML-Modell: Backtesting auf historischen Daten
- Metric: Accuracy der Klassen-Vorhersage + MAE des empfohlenen Gewichts
- Frontend: mindestens manuelle Tests aller kritischen Flows

### Code-Stil
- Backend: Type hints überall, Pydantic für alle API-Schemas
- Frontend: Komponenten klein halten (<150 Zeilen), Custom Hooks für API-Calls
- ML-Code: Jupyter Notebooks für Exploration, saubere .py Files für Production

---

## Start-Befehl für Claude Code

Beginne mit Phase 1.1 – lege die vollständige Projektstruktur an und implementiere dann Schritt für Schritt in der angegebenen Reihenfolge. Frage nach jeder Phase ob du weitermachen sollst.
