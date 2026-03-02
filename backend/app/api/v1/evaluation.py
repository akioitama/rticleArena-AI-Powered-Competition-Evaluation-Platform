from typing import Any
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.submission import Submission, SubmissionStatus
from app.models.evaluation import Evaluation
from app.models.user import User
from app.schemas.submission import Evaluation as EvaluationSchema, EvaluationCreate
from app.api.deps import get_current_admin
from app.services.ai.evaluator import evaluate_article

router = APIRouter()

def process_evaluation_task(submission_id: int, db: Session):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission or submission.status != SubmissionStatus.PENDING:
        return
        
    try:
        # Call the Google GenAI API evaluator
        result = evaluate_article(submission.content, submission.competition)
        
        evaluation = Evaluation(
            submission_id=submission.id,
            score=result.score,
            feedback=result.feedback
        )
        
        submission.status = SubmissionStatus.EVALUATED
        db.add(evaluation)
        db.commit()
    except Exception as e:
        print(f"Error evaluating submission {submission_id}: {e}")
        submission.status = SubmissionStatus.ERROR
        db.commit()

@router.post("/{submission_id}", response_model=dict)
def trigger_evaluation(
    submission_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Manually trigger AI evaluation for a specific submission (Admin only)."""
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if submission.status == SubmissionStatus.EVALUATED:
        raise HTTPException(status_code=400, detail="Submission has already been evaluated")
        
    # Queue the evaluation as a background task so it doesn't block the API request
    background_tasks.add_task(process_evaluation_task, submission_id, db)
    
    return {"message": "Evaluation triggered successfully in the background", "submission_id": submission_id}

@router.post("/{submission_id}/manual", response_model=EvaluationSchema)
def submit_manual_evaluation(
    submission_id: int,
    eval_in: EvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Submit a manual evaluation score for a specific submission (Admin only)."""
    
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if submission.status == SubmissionStatus.EVALUATED:
        raise HTTPException(status_code=400, detail="Submission has already been evaluated")
        
    evaluation = Evaluation(
        submission_id=submission.id,
        score=eval_in.score,
        feedback=eval_in.feedback
    )
    
    submission.status = SubmissionStatus.EVALUATED
    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)
    
    return evaluation
