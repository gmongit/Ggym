from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BodyMetricCreate(BaseModel):
    date: Optional[datetime] = None
    weight_kg: float
    body_fat_percent: Optional[float] = None

class BodyMetricResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    weight_kg: float
    body_fat_percent: Optional[float] = None

    model_config = {"from_attributes": True}
