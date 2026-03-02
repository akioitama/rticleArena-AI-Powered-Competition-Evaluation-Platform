from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.session import get_db
from app.models.competition import Competition
from app.models.submission import Submission, SubmissionStatus
from app.models.evaluation import Evaluation
from app.models.user import User
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/{competition_id}")
def get_leaderboard(
    competition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get the leaderboard for a specific competition."""
    competition = db.query(Competition).filter(Competition.id == competition_id).first()
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
        
    submissions = (
        db.query(Submission, Evaluation, User.email)
        .join(Evaluation, Submission.id == Evaluation.submission_id)
        .join(User, Submission.competitor_id == User.id)
        .filter(Submission.competition_id == competition_id)
        .filter(Submission.status == SubmissionStatus.EVALUATED)
        .order_by(desc(Evaluation.score))
        .all()
    )
    
    leaderboard = []
    for rank, (sub, eval, email) in enumerate(submissions, start=1):
        leaderboard.append({
            "rank": rank,
            "submission_id": sub.id,
            "competitor_email": email,
            "score": eval.score,
            "submitted_at": sub.created_at
        })
        
    return leaderboard
