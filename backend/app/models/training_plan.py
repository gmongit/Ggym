from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..database import Base


class TrainingPlan(Base):
    __tablename__ = "training_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)  # z.B. "PPL Split", "Upper/Lower"

    days = relationship("TrainingDay", back_populates="plan", cascade="all, delete-orphan", order_by="TrainingDay.day_order")


class TrainingDay(Base):
    __tablename__ = "training_days"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("training_plans.id"), nullable=False)
    name = Column(String, nullable=False)   # z.B. "Push Day", "Brust & Trizeps"
    day_order = Column(Integer, default=0)  # Reihenfolge im Plan

    plan = relationship("TrainingPlan", back_populates="days")
    exercises = relationship("TrainingDayExercise", back_populates="day", cascade="all, delete-orphan", order_by="TrainingDayExercise.order")


class TrainingDayExercise(Base):
    __tablename__ = "training_day_exercises"

    id = Column(Integer, primary_key=True, index=True)
    day_id = Column(Integer, ForeignKey("training_days.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    order = Column(Integer, default=0)
    target_sets = Column(Integer, default=3)
    target_reps_min = Column(Integer, default=8)
    target_reps_max = Column(Integer, default=12)

    day = relationship("TrainingDay", back_populates="exercises")
    exercise = relationship("Exercise")
