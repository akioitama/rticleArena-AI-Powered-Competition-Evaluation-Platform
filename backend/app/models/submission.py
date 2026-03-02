from sqlalchemy import Column, Integer, Text, ForeignKey, String, Enum, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime, timezone
import enum

class SubmissionStatus(str, enum.Enum):
    PENDING = "pending"
    EVALUATED = "evaluated"
    ERROR = "error"

class Submission(Base):
    id = Column(Integer, primary_key=True, index=True)
    competitor_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    competition_id = Column(Integer, ForeignKey("competition.id"), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(SubmissionStatus), default=SubmissionStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    
    competitor = relationship("User", back_populates="submissions")
    competition = relationship("Competition", back_populates="submissions")
    evaluation = relationship("Evaluation", back_populates="submission", uselist=False)
