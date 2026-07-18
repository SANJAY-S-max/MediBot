import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.config import settings
from app.database import engine, Base
from app.ai.rag_service import rag_service

# Import routers
from app.routes import auth, assessments, appointments, reminders, doctors, admin, ivr

logger = logging.getLogger("uvicorn.error")

# Auto-create tables (particularly for SQLite local development)
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
except Exception as e:
    logger.error(f"Error creating database tables: {str(e)}")

# Initialize FastAPI
app = FastAPI(
    title="MediBot API",
    description="Multilingual AI Healthcare Assistant & Clinical Dispatcher Backend",
    version="1.0.0"
)

# CORS Middleware configurations
import os
_frontend_url = os.getenv("FRONTEND_URL", "")
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "https://*.vercel.app",
    "https://medibot-app.loca.lt",
]
if _frontend_url:
    origins.append(_frontend_url)
# Allow all in dev/staging; tighten for production if needed
origins.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(assessments.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(doctors.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(ivr.router, prefix="/api")

@app.get("/")
def root_endpoint():
    return {
        "status": "online",
        "service": "MediBot AI Healthcare Assistant Backend",
        "api_docs": "/docs",
        "multilingual_support": ["en", "hi", "ta"],
        "voice_support": "Twilio IVR Webhooks Active"
    }

# Run RAG vector building inside startup event if library is available
@app.on_event("startup")
def startup_populate_rag():
    logger.info("Building RAG vector search indices...")
    try:
        rag_service.build_index()
    except Exception as e:
        logger.error(f"Failed to compile RAG index on start: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
