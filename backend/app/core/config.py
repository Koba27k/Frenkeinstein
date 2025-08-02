"""
Application configuration using Pydantic BaseSettings.
"""
from typing import List
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings with environment variable support."""
    
    # Application
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str
    DATABASE_URL_TEST: str = "sqlite:///./test.db"
    
    # Security
    ALLOWED_HOSTS: List[str] = ["localhost", "127.0.0.1", "0.0.0.0"]
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # Twilio WhatsApp
    TWILIO_ACCOUNT_SID: str
    TWILIO_AUTH_TOKEN: str
    TWILIO_WHATSAPP_FROM: str
    
    # Stripe
    STRIPE_PUBLISHABLE_KEY: str
    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str
    
    # TTS
    TTS_MODEL_PATH: str = "./models/tts/italian_model.pth"
    TTS_LANGUAGE: str = "it"
    
    # Calendar
    CALDAV_URL: str = ""
    CALDAV_USERNAME: str = ""
    CALDAV_PASSWORD: str = ""
    
    # Rasa
    RASA_SERVER_URL: str = "http://localhost:5005"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()