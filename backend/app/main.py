from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import health
from app.routers import gifts
from app.routers import rsvp
from app.routers import messages

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(gifts.router, prefix="/api/gifts", tags=["gifts"])
app.include_router(rsvp.router, prefix="/api/rsvp", tags=["rsvp"])
app.include_router(messages.router, prefix="/api/messages", tags=["messages"])
