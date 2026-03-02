"""
Seed demo users into the database.
Run from backend directory: python seed_demo_users.py
"""
import sys
import os

# Ensure we load .env from backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.getcwd())

from dotenv import load_dotenv
load_dotenv()

import bcrypt
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker


def get_password_hash(password: str) -> str:
    """Hash password with bcrypt (compatible with passlib)."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

DEMO_USERS = [
    ("admin@gmail.com", "@itamaadmin123", "ADMIN"),
    ("user1@gmail.com", "@itamauser1", "COMPETITOR"),
    ("user2@gmail.com", "@itamauser2", "COMPETITOR"),
    ("user3@gmail.com", "user3@gmail.com", "COMPETITOR"),
]


OLD_EMAILS = ["admin", "user1", "user2"]  # Legacy format to remove


def seed():
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not set in .env")
        sys.exit(1)

    engine = create_engine(database_url)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        # Remove old users without @gmail.com
        for old_email in OLD_EMAILS:
            result = db.execute(
                text('DELETE FROM "user" WHERE email = :email'),
                {"email": old_email},
            )
            if result.rowcount:
                print(f"Removed legacy user: {old_email}")

        for email, password, role in DEMO_USERS:
            hashed = get_password_hash(password)
            result = db.execute(
                text("SELECT id FROM \"user\" WHERE email = :email"),
                {"email": email}
            )
            if result.fetchone():
                db.execute(
                    text(
                        'UPDATE "user" SET hashed_password = :hashed_password '
                        "WHERE email = :email"
                    ),
                    {"email": email, "hashed_password": hashed},
                )
                print(f"Updated password: {email} ({role})")
            else:
                db.execute(
                    text(
                        'INSERT INTO "user" (email, hashed_password, role, is_active) '
                        "VALUES (:email, :hashed_password, :role, true)"
                    ),
                    {
                        "email": email,
                        "hashed_password": hashed,
                        "role": role,
                    },
                )
                print(f"Created: {email} ({role})")
        db.commit()
        print("\nDemo users seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
