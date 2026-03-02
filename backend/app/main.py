from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, competitions, submissions, evaluation, leaderboard

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Setup CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(competitions.router, prefix=f"{settings.API_V1_STR}/competitions", tags=["competitions"])
app.include_router(submissions.router, prefix=f"{settings.API_V1_STR}/submissions", tags=["submissions"])
app.include_router(evaluation.router, prefix=f"{settings.API_V1_STR}/evaluation", tags=["evaluation"])
app.include_router(leaderboard.router, prefix=f"{settings.API_V1_STR}/leaderboard", tags=["leaderboard"])

@app.get("/")
def root():
    return {"message": "Welcome to the AI Article Evaluation API"}
