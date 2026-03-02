from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CriteriaBase(BaseModel):
    name: str
    description: Optional[str] = None
    weight: float = 1.0

class CriteriaCreate(CriteriaBase):
    pass

class Criteria(CriteriaBase):
    id: int
    competition_id: int

    class Config:
        from_attributes = True

class CompetitionBase(BaseModel):
    title: str
    description: Optional[str] = None
    guidelines: Optional[str] = None
    is_active: bool = True

class CompetitionCreate(CompetitionBase):
    criteria: Optional[List[CriteriaCreate]] = None

class CompetitionUpdate(CompetitionBase):
    title: Optional[str] = None
    
class Competition(CompetitionBase):
    id: int
    created_at: datetime
    criteria: List[Criteria] = []

    class Config:
        from_attributes = True
