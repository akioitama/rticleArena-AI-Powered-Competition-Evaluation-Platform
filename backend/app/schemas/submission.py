from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.submission import SubmissionStatus

class EvaluationBase(BaseModel):
    score: float
    feedback: str

class EvaluationCreate(EvaluationBase):
    pass

class Evaluation(EvaluationBase):
    id: int
    submission_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SubmissionBase(BaseModel):
    content: str
    competition_id: int

class SubmissionCreate(SubmissionBase):
    pass

class Submission(SubmissionBase):
    id: int
    competitor_id: int
    status: SubmissionStatus
    created_at: datetime
    evaluation: Optional[Evaluation] = None

    class Config:
        from_attributes = True
