"""
Background worker for precomputing answers.
This can be run as a Celery task or as a standalone async worker.
"""
from celery import Celery
from app.config import settings
from app.services.intent_predictor import intent_predictor
from app.services.next_agent import next_agent
from app.services.precompute_agent import precompute_agent
from app.services.cache import CacheManager
from app.db.mongo import get_database
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    "mindnext_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

@celery_app.task(name="precompute_answer_task")
def precompute_answer_task(session_id: str, predicted_question: str, confidence: float):
    """
    Background task to precompute an answer for a predicted question.
    This runs asynchronously to avoid blocking the API.
    """
    import asyncio
    
    async def _precompute():
        try:
            # Expand topics
            topics = await next_agent.expand_topics(predicted_question)
            
            # Plan RAG documents
            rag_docs = await next_agent.plan_rag_documents(predicted_question, topics)
            
            # Precompute answer
            precomputed = await precompute_agent.precompute_answer(
                predicted_question,
                topics,
                rag_docs
            )
            
            if precomputed.get("ready_answer"):
                precomputed_answer_id = f"pre_{uuid.uuid4().hex[:8]}"
                
                # Store in cache
                await CacheManager.set_precomputed_answer(
                    precomputed_answer_id,
                    {
                        "answer": precomputed["ready_answer"],
                        "question": predicted_question,
                        "context_used": precomputed["context_used"]
                    }
                )
                
                # Store in MongoDB
                from motor.motor_asyncio import AsyncIOMotorClient
                client = AsyncIOMotorClient(settings.MONGODB_URL)
                db = client[settings.MONGODB_DB_NAME]
                
                prediction_doc = {
                    "session_id": session_id,
                    "predicted_question": predicted_question,
                    "confidence": confidence,
                    "likely_topics": topics,
                    "required_rag_docs": rag_docs,
                    "precomputed_answer": precomputed["ready_answer"],
                    "precomputed_answer_id": precomputed_answer_id,
                    "created_at": datetime.utcnow()
                }
                await db.predictions.insert_one(prediction_doc)
                client.close()
                
                logger.info(f"Precomputed answer {precomputed_answer_id} for session {session_id}")
                return precomputed_answer_id
            
        except Exception as e:
            logger.error(f"Error in precompute task: {e}")
            return None
    
    # Run async function
    loop = asyncio.get_event_loop()
    return loop.run_until_complete(_precompute())

# For running worker: celery -A app.workers.precompute_worker.celery_app worker --loglevel=info

