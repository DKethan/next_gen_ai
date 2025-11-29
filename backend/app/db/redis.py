import redis.asyncio as redis
from app.config import settings
import logging
import json

logger = logging.getLogger(__name__)

redis_client: redis.Redis = None

async def connect_to_redis():
    """Create Redis connection"""
    global redis_client
    try:
        redis_client = await redis.from_url(
            settings.REDIS_URL,
            db=settings.REDIS_DB,
            decode_responses=True
        )
        logger.info("Connected to Redis")
    except Exception as e:
        logger.warning(f"Could not connect to Redis: {e}. Continuing without Redis caching.")
        redis_client = None

async def close_redis_connection():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Disconnected from Redis")

async def get_redis():
    """Get Redis client instance"""
    return redis_client

async def cache_set(key: str, value: dict, ttl: int = 3600):
    """Set cache value"""
    if redis_client:
        await redis_client.setex(key, ttl, json.dumps(value))

async def cache_get(key: str) -> dict | None:
    """Get cache value"""
    if redis_client:
        value = await redis_client.get(key)
        if value:
            return json.loads(value)
    return None

async def cache_delete(key: str):
    """Delete cache value"""
    if redis_client:
        await redis_client.delete(key)

