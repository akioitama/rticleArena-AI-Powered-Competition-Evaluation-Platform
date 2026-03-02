from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Article Evaluation Dashboard"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str
    OPENAI_API_KEY: str
    SECRET_KEY: str = "secret-key-change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 3000

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
