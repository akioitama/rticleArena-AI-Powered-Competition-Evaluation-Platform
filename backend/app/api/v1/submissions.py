from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.submission import Submission, SubmissionStatus
from app.models.competition import Competition
from app.models.user import User, UserRole
from app.schemas.submission import Submission as SubmissionSchema, SubmissionCreate
from app.api.deps import get_current_user, get_current_admin
from app.services.files.parser import extract_text_from_file

router = APIRouter()

@router.post("/", response_model=SubmissionSchema)
async def create_submission(
    *,
    db: Session = Depends(get_db),
    competition_id: int = Form(...),
    content: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Submit an article (either direct text or file upload)."""
    
    # Verify competition exists and is active
    competition = db.query(Competition).filter(Competition.id == competition_id).first()
    if not competition or not competition.is_active:
        raise HTTPException(status_code=404, detail="Active competition not found")
        
    # Check if competitor already submitted
    existing = db.query(Submission).filter(
        Submission.competition_id == competition_id,
        Submission.competitor_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted to this competition")

    # Extract text from file if provided, otherwise use text content
    article_text = ""
    if file:
        article_text = await extract_text_from_file(file)
    elif content:
        article_text = content
    else:
        raise HTTPException(status_code=400, detail="Must provide either text content or a file upload")
        
    submission = Submission(
        competitor_id=current_user.id,
        competition_id=competition.id,
        content=article_text,
        status=SubmissionStatus.PENDING
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    return submission


@router.get("/pending", response_model=List[SubmissionSchema])
def get_all_pending_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Get all pending submissions across all competitions (Admin only)"""
    submissions = db.query(Submission).filter(Submission.status == SubmissionStatus.PENDING).all()
    return submissions


@router.get("/competition/{competition_id}", response_model=List[SubmissionSchema])
def get_competition_submissions(
    competition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
) -> Any:
    """Get all submissions for a competition (Admin only)"""
    submissions = db.query(Submission).filter(Submission.competition_id == competition_id).all()
    return submissions

@router.get("/me", response_model=List[SubmissionSchema])
def get_my_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get current user's submissions"""
    submissions = db.query(Submission).filter(Submission.competitor_id == current_user.id).all()
    return submissions

@router.get("/{id}", response_model=SubmissionSchema)
def get_submission(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """Get a specific submission details"""
    submission = db.query(Submission).filter(Submission.id == id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
        
    if current_user.role != UserRole.ADMIN and submission.competitor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    return submission
