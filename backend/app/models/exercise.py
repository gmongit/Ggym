from sqlalchemy import Column, Integer, String, Enum as SAEnum, ForeignKey
from sqlalchemy.orm import relationship
import enum
from ..database import Base

class MuscleGroup(str, enum.Enum):
    chest = "chest"
    back = "back"
    shoulders = "shoulders"
    biceps = "biceps"
    triceps = "triceps"
    legs = "legs"
    core = "core"

class ExerciseType(str, enum.Enum):
    compound = "compound"
    isolation = "isolation"

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    muscle_group = Column(SAEnum(MuscleGroup), nullable=False)
    exercise_type = Column(SAEnum(ExerciseType), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    creator = relationship("User", back_populates="exercises")
    sets = relationship("Set", back_populates="exercise")
    ml_predictions = relationship("MLPrediction", back_populates="exercise")
