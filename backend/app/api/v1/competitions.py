from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.competition import Competition
from app.models.criteria import Criteria
from app.models.user import User
from app.schemas.competition import Competition as CompetitionSchema, CompetitionCreate, CompetitionUpdate
from app.api.deps import get_current_user, get_current_admin

router = APIRouter()

@router.get("/", response_model=List[CompetitionSchema])
def read_competitions(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
) -> Any:
    """Retrieve all competitions (both roles can view)."""
    competitions = db.query(Competition).offset(skip).limit(limit).all()
    return competitions

@router.get("/{id}", response_model=CompetitionSchema)
def read_competition(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Any:
    """Get a specific competition by id."""
    competition = db.query(Competition).filter(Competition.id == id).first()
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    return competition

@router.post("/", response_model=CompetitionSchema)
def create_competition(
    *,
    db: Session = Depends(get_db),
    competition_in: CompetitionCreate,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """Create new competition (Admin only)."""
    competition = Competition(
        title=competition_in.title,
        description=competition_in.description,
        guidelines=competition_in.guidelines,
        is_active=competition_in.is_active
    )
    db.add(competition)
    db.commit()
    db.refresh(competition)
    
    if competition_in.criteria:
        for criteria_in in competition_in.criteria:
            criteria = Criteria(
                competition_id=competition.id,
                name=criteria_in.name,
                description=criteria_in.description,
                weight=criteria_in.weight
            )
            db.add(criteria)
        db.commit()
        db.refresh(competition)
        
    return competition

@router.put("/{id}", response_model=CompetitionSchema)
def update_competition(
    *,
    db: Session = Depends(get_db),
    id: int,
    competition_in: CompetitionUpdate,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """Update a competition (Admin only)."""
    competition = db.query(Competition).filter(Competition.id == id).first()
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
    
    update_data = competition_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(competition, field, value)
        
    db.add(competition)
    db.commit()
    db.refresh(competition)
    return competition

@router.delete("/{id}")
def delete_competition(
    *,
    db: Session = Depends(get_db),
    id: int,
    current_user: User = Depends(get_current_admin),
) -> Any:
    """Delete a competition (Admin only)."""
    competition = db.query(Competition).filter(Competition.id == id).first()
    if not competition:
        raise HTTPException(status_code=404, detail="Competition not found")
        
    db.delete(competition)
    db.commit()
    return {"ok": True}
