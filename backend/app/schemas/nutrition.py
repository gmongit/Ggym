from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from ..models.nutrition import MealType

class NutritionLogCreate(BaseModel):
    date: Optional[datetime] = None
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    food_name: str
    meal_type: MealType

class NutritionLogResponse(BaseModel):
    id: int
    user_id: int
    date: datetime
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    food_name: str
    meal_type: MealType

    model_config = {"from_attributes": True}

class NutritionSummary(BaseModel):
    date: str
    total_calories: float
    total_protein_g: float
    total_carbs_g: float
    total_fat_g: float
    entries: list[NutritionLogResponse]
