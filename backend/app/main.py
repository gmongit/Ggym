from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, exercises, workouts, nutrition, body_metrics, ml, training_plans

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="FitTrack AI API",
    description="Fitness Tracking mit ML-getriebenem Progress-Coaching",
    version="1.0.0"
)

import os

_origins = ["http://localhost:5173", "http://localhost:3000"]
_frontend = os.getenv("FRONTEND_URL", "")
if _frontend:
    _origins.append(_frontend)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(workouts.router)
app.include_router(nutrition.router)
app.include_router(body_metrics.router)
app.include_router(ml.router)
app.include_router(training_plans.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}
