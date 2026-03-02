from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Criteria(Base):
    id = Column(Integer, primary_key=True, index=True)
    competition_id = Column(Integer, ForeignKey("competition.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    weight = Column(Float, default=1.0)

    competition = relationship("Competition", back_populates="criteria")
