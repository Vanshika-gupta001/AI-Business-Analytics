import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from sqlalchemy.orm import relationship

from database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=_now)

    datasets = relationship(
        "Dataset", back_populates="owner", cascade="all, delete-orphan"
    )


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(String, primary_key=True, default=_uuid)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)

    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)

    rows = Column(Integer, nullable=True)
    columns = Column(Integer, nullable=True)
    health_score = Column(Float, nullable=True)
    grade = Column(String, nullable=True)

    # Full analysis payload (insights, column_summary, chart paths, etc.)
    # stored as JSON so the dashboard can be reloaded without recomputing.
    analysis_result = Column(JSON, nullable=True)

    report_path = Column(String, nullable=True)

    created_at = Column(DateTime, default=_now)

    owner = relationship("User", back_populates="datasets")
    chat_messages = relationship(
        "ChatMessage", back_populates="dataset", cascade="all, delete-orphan"
    )
    training_runs = relationship(
        "TrainingRun", back_populates="dataset", cascade="all, delete-orphan"
    )


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=_uuid)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)

    role = Column(String, nullable=False)  # "user" | "ai"
    text = Column(Text, nullable=False)

    created_at = Column(DateTime, default=_now)

    dataset = relationship("Dataset", back_populates="chat_messages")


class TrainingRun(Base):
    __tablename__ = "training_runs"

    id = Column(String, primary_key=True, default=_uuid)
    dataset_id = Column(String, ForeignKey("datasets.id"), nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)

    target_column = Column(String, nullable=False)
    problem_type = Column(String, nullable=True)
    algorithm = Column(String, nullable=True)
    metrics = Column(JSON, nullable=True)
    feature_importance = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=_now)

    dataset = relationship("Dataset", back_populates="training_runs")
