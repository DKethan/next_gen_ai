from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from app.services.intent_predictor import intent_predictor
from app.services.next_agent import next_agent
from app.services.precompute_agent import precompute_agent
from app.services.cache import CacheManager
from app.models.prediction import Prediction
from app.db.mongo import get_database
from app.config import settings
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class PredictRequest(BaseModel):
    session_id: str
    messages: List[Dict[str, str]]

class PredictResponse(BaseModel):
    predicted_question: str
    confidence: float
    suggestions: List[str]
    precomputed_answer_id: Optional[str] = None
    predictions: List[Dict] = []

@router.post("/predict-intent", response_model=PredictResponse)
async def predict_intent(request: PredictRequest):
    """
    Predict the next question the user is likely to ask.
    This triggers the multi-agent pipeline:
    1. Intent Predictor
    2. Topic Expansion
    3. RAG Document Planning
    4. Answer Precomputation
    """
    try:
        # Don't use cache - predictions should be fresh based on current conversation state
        # Cache key would need to include message hash to be accurate, which defeats the purpose
        # Always generate fresh predictions based on current messages
        
        # Step 1: Intent Prediction
        prediction_result = await intent_predictor.predict(request.messages)
        
        predicted_question = prediction_result["predicted_question"]
        confidence = prediction_result["confidence"]
        predictions = prediction_result.get("predictions", [])
        
        # Step 2: Topic Expansion
        topics = await next_agent.expand_topics(predicted_question)
        
        # Step 3: RAG Document Planning
        rag_docs = await next_agent.plan_rag_documents(predicted_question, topics)
        
        # Step 4: Precompute Answer (if confidence is high enough)
        precomputed_answer_id = None
        if confidence >= settings.PREDICTION_CONFIDENCE_THRESHOLD:
            precomputed = await precompute_agent.precompute_answer(
                predicted_question,
                topics,
                rag_docs
            )
            
            if precomputed.get("ready_answer"):
                precomputed_answer_id = f"pre_{uuid.uuid4().hex[:8]}"
                
                # Store precomputed answer in cache
                await CacheManager.set_precomputed_answer(
                    precomputed_answer_id,
                    {
                        "answer": precomputed["ready_answer"],
                        "question": predicted_question,
                        "context_used": precomputed["context_used"]
                    }
                )
                
                # Store in MongoDB
                db = await get_database()
                prediction_doc = {
                    "session_id": request.session_id,
                    "predicted_question": predicted_question,
                    "confidence": confidence,
                    "predictions": predictions,
                    "likely_topics": topics,
                    "required_rag_docs": rag_docs,
                    "precomputed_answer": precomputed["ready_answer"],
                    "precomputed_answer_id": precomputed_answer_id,
                    "created_at": datetime.utcnow()
                }
                await db.predictions.insert_one(prediction_doc)
        
        # Prepare response
        response_data = {
            "predicted_question": predicted_question,
            "confidence": confidence,
            "suggestions": topics,
            "precomputed_answer_id": precomputed_answer_id,
            "predictions": predictions
        }
        
        # Don't cache predictions - they should be fresh for each conversation state
        # Caching causes stale predictions when conversation moves forward
        
        return PredictResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error in predict_intent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/precomputed-answer/{answer_id}")
async def get_precomputed_answer(answer_id: str):
    """Retrieve a precomputed answer by ID"""
    try:
        # Check cache first
        cached = await CacheManager.get_precomputed_answer(answer_id)
        if cached:
            return cached
        
        # Check MongoDB
        db = await get_database()
        prediction = await db.predictions.find_one({"precomputed_answer_id": answer_id})
        
        if prediction:
            return {
                "answer": prediction.get("precomputed_answer"),
                "question": prediction.get("predicted_question"),
                "context_used": prediction.get("required_rag_docs", [])
            }
        
        raise HTTPException(status_code=404, detail="Precomputed answer not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting precomputed answer: {e}")
        raise HTTPException(status_code=500, detail=str(e))

