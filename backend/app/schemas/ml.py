from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MLRecommendation(BaseModel):
    exercise_id: int
    exercise_name: str
    recommendation_class: str
    recommendation_label: str
    confidence: float
    suggested_weight_kg: Optional[float] = None
    suggested_reps: Optional[int] = None
    explanation: str
    model_version: str

class MLFeedback(BaseModel):
    prediction_id: int
    rating: int  # 1-5

class ChatMessage(BaseModel):
    role: str   # "user" oder "assistant"
    content: str

class ChatRequest(BaseModel):
    message: str
    exercise_id: Optional[int] = None
    chat_history: list[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    quick_questions: list[str]

class WeeklySummary(BaseModel):
    week_start: str
    total_sessions: int
    total_volume_kg: float
    top_exercises: list[str]
    avg_perceived_exertion: Optional[float]
    recommendations: list[str]
