import os
import sys
import random
import asyncio
import argparse

# Add the project root to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.competition import Competition
from app.models.submission import Submission, SubmissionStatus
from app.models.evaluation import Evaluation
from app.models.criteria import Criteria
from app.core.security import get_password_hash

# Mock Data
COMPETITIONS = [
    {
        "title": "The Future of GenAI: Promises and Perils",
        "description": "Analyze the trajectory of Generative AI over the next decade. Discuss the potential benefits to society alongside the ethical and economic risks.",
        "is_active": True
    },
    {
        "title": "AI in Healthcare: Real-World Applications",
        "description": "Explore how Machine Learning and AI are currently transforming diagnostics, patient care, and medical research. Provide concrete examples.",
        "is_active": True
    },
    {
        "title": "Quantum Computing & AI: The Next Frontier",
        "description": "How will the eventual arrival of practical quantum computing impact current AI models? Discuss algorithmic shifts and timeline predictions.",
        "is_active": True
    }
]

COMPETITORS = [
    "alice@example.com", "bob@example.com", "charlie@example.com", 
    "diana@example.com", "ethan@example.com", "fiona@example.com",
    "george@example.com", "hannah@example.com", "ian@example.com",
    "julia@example.com", "kevin@example.com", "laura@example.com",
    "mike@example.com", "nina@example.com", "oliver@example.com"
]

def seed_data(db: Session, clean: bool = False):
    if clean:
        print("Cleaning existing competitions, submissions, and competitors...")
        db.query(Evaluation).delete()
        db.query(Submission).delete()
        db.query(Competition).delete()
        db.query(User).filter(User.role == UserRole.COMPETITOR).delete()
        db.commit()

    print("Seeding competitors...")
    user_objects = []
    for email in COMPETITORS:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                hashed_password=get_password_hash("password123"),
                role=UserRole.COMPETITOR
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        user_objects.append(user)

    print("Seeding competitions...")
    comp_objects = []
    for comp_data in COMPETITIONS:
        comp = db.query(Competition).filter(Competition.title == comp_data["title"]).first()
        if not comp:
            comp = Competition(**comp_data)
            db.add(comp)
            db.commit()
            db.refresh(comp)
        comp_objects.append(comp)

    print("Generating mock submissions & evaluations...")
    for comp in comp_objects:
        # Pick a random subset of 5-10 competitors for each competition
        participants = random.sample(user_objects, random.randint(5, 12))
        
        for user in participants:
            # Check if submission exists
            existing_sub = db.query(Submission).filter(
                Submission.competition_id == comp.id,
                Submission.competitor_id == user.id
            ).first()

            if not existing_sub:
                sub = Submission(
                    competition_id=comp.id,
                    competitor_id=user.id,
                    content=f"This is a mock submission by {user.email} for {comp.title}. The content explores various themes related to the topic...",
                    status=SubmissionStatus.EVALUATED
                )
                db.add(sub)
                db.commit()
                db.refresh(sub)
                
                # Create a mock evaluation
                base_score = random.uniform(50, 95)
                grammar = min(100, base_score + random.uniform(-10, 10))
                relevance = min(100, base_score + random.uniform(-10, 15))
                coherence = min(100, base_score + random.uniform(-15, 10))
                originality = min(100, base_score + random.uniform(-20, 20))
                total_score = (grammar * 0.2) + (relevance * 0.3) + (coherence * 0.3) + (originality * 0.2)

                eval_record = Evaluation(
                    submission_id=sub.id,
                    score=total_score,
                    feedback="[MOCK FEEDBACK] This is an automatically generated evaluation. The structure is good, but consider diving deeper into specific examples.",
                )
                db.add(eval_record)
                db.commit()

    print("Data seeded successfully!")

def main():
    parser = argparse.ArgumentParser(description="Seed initial competitions and mock submissions.")
    parser.add_argument("--clean", action="store_true", help="Delete existing mock data before seeding")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        seed_data(db, clean=args.clean)
    finally:
        db.close()

if __name__ == "__main__":
    main()
