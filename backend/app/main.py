"""
Main FastAPI application entry point.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import create_tables
from app.routes import appointment, tts, payment, auth


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup/shutdown events."""
    # Startup
    await create_tables()
    yield
    # Shutdown
    pass


# Create FastAPI app with lifespan
app = FastAPI(
    title="Metis Connect API",
    description="Virtual Secretary for Barbershop",
    version="1.0.0",
    lifespan=lifespan
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(appointment.router, prefix="/api/appointments", tags=["appointments"])
app.include_router(tts.router, prefix="/api/tts", tags=["text-to-speech"])
app.include_router(payment.router, prefix="/api/payments", tags=["payments"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"message": "Metis Connect API is running"}


@app.get("/health")
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }