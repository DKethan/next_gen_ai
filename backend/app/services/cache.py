from app.db.redis import cache_get, cache_set, cache_delete
from typing import Optional
import hashlib
import json

class CacheManager:
    @staticmethod
    def _make_key(prefix: str, identifier: str) -> str:
        """Create a cache key"""
        return f"{prefix}:{identifier}"
    
    @staticmethod
    async def get_prediction(session_id: str) -> Optional[dict]:
        """Get cached prediction for session"""
        key = CacheManager._make_key("prediction", session_id)
        return await cache_get(key)
    
    @staticmethod
    async def set_prediction(session_id: str, prediction: dict, ttl: int = 3600):
        """Cache prediction for session"""
        key = CacheManager._make_key("prediction", session_id)
        await cache_set(key, prediction, ttl)
    
    @staticmethod
    async def get_precomputed_answer(answer_id: str) -> Optional[dict]:
        """Get cached precomputed answer"""
        key = CacheManager._make_key("precomputed", answer_id)
        return await cache_get(key)
    
    @staticmethod
    async def set_precomputed_answer(answer_id: str, answer: dict, ttl: int = 7200):
        """Cache precomputed answer"""
        key = CacheManager._make_key("precomputed", answer_id)
        await cache_set(key, answer, ttl)
    
    @staticmethod
    async def get_rag_context(query_hash: str) -> Optional[dict]:
        """Get cached RAG context"""
        key = CacheManager._make_key("rag", query_hash)
        return await cache_get(key)
    
    @staticmethod
    async def set_rag_context(query_hash: str, context: dict, ttl: int = 1800):
        """Cache RAG context"""
        key = CacheManager._make_key("rag", query_hash)
        await cache_set(key, context, ttl)
    
    @staticmethod
    def hash_query(query: str) -> str:
        """Generate hash for query"""
        return hashlib.md5(query.encode()).hexdigest()



