from sqlalchemy import Column, Integer, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime, timezone

class Evaluation(Base):
    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submission.id"), unique=True, nullable=False)
    score = Column(Float, nullable=False)
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    submission = relationship("Submission", back_populates="evaluation")
