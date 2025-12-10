from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.db.mongo import connect_to_mongo, close_mongo_connection
from app.db.redis import connect_to_redis, close_redis_connection
from app.routes import chat, predict, rag, ws

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up NextMind API...")
    await connect_to_mongo()
    try:
        await connect_to_redis()
    except Exception as e:
        logger.warning(f"Redis connection failed, continuing without cache: {e}")
    logger.info("Startup complete")
    yield
    # Shutdown
    logger.info("Shutting down NextMind API...")
    await close_mongo_connection()
    try:
        await close_redis_connection()
    except Exception:
        pass  # Ignore errors on shutdown if Redis wasn't connected
    logger.info("Shutdown complete")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(predict.router, prefix=settings.API_V1_PREFIX, tags=["prediction"])
app.include_router(chat.router, prefix=settings.API_V1_PREFIX, tags=["chat"])
app.include_router(rag.router, prefix=settings.API_V1_PREFIX, tags=["rag"])
app.include_router(ws.router, prefix=settings.API_V1_PREFIX, tags=["websocket"])

@app.get("/")
async def root():
    return {
        "message": "NextMind API",
        "version": settings.VERSION,
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

