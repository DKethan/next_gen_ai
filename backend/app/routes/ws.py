from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Set
import json
import logging
from app.services.intent_predictor import intent_predictor
from app.services.next_agent import next_agent
from app.services.precompute_agent import precompute_agent
from app.services.cache import CacheManager
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        logger.info(f"WebSocket connected for session {session_id}")
    
    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]
            logger.info(f"WebSocket disconnected for session {session_id}")
    
    async def send_personal_message(self, message: dict, session_id: str):
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {session_id}: {e}")
                self.disconnect(session_id)

manager = ConnectionManager()

@router.websocket("/suggestions/live/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for live prediction suggestions.
    Client sends messages as they type, server responds with predictions.
    """
    await manager.connect(websocket, session_id)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            messages = message_data.get("messages", [])
            current_input = message_data.get("current_input", "")
            
            if not messages:
                continue
            
            # Only predict if user has typed something meaningful
            if len(current_input.strip()) < 3:
                continue
            
            try:
                # Get prediction
                prediction_result = await intent_predictor.predict(messages)
                
                predicted_question = prediction_result["predicted_question"]
                confidence = prediction_result["confidence"]
                
                # Only send if confidence is reasonable
                if confidence >= 0.5:
                    # Expand topics
                    topics = await next_agent.expand_topics(predicted_question)
                    
                    # Send suggestion
                    suggestion = {
                        "type": "suggestion",
                        "predicted_question": predicted_question,
                        "confidence": confidence,
                        "topics": topics,
                        "timestamp": message_data.get("timestamp")
                    }
                    
                    await manager.send_personal_message(suggestion, session_id)
                    
                    # If confidence is high, trigger precomputation in background
                    if confidence >= settings.PREDICTION_CONFIDENCE_THRESHOLD:
                        # This could be done asynchronously
                        rag_docs = await next_agent.plan_rag_documents(predicted_question, topics)
                        precomputed = await precompute_agent.precompute_answer(
                            predicted_question,
                            topics,
                            rag_docs
                        )
                        
                        if precomputed.get("ready_answer"):
                            # Store precomputed answer
                            import uuid
                            precomputed_answer_id = f"pre_{uuid.uuid4().hex[:8]}"
                            
                            await CacheManager.set_precomputed_answer(
                                precomputed_answer_id,
                                {
                                    "answer": precomputed["ready_answer"],
                                    "question": predicted_question,
                                    "context_used": precomputed["context_used"]
                                }
                            )
                            
                            # Notify client that answer is ready
                            await manager.send_personal_message({
                                "type": "precomputed_ready",
                                "precomputed_answer_id": precomputed_answer_id,
                                "predicted_question": predicted_question
                            }, session_id)
            
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await manager.send_personal_message({
                    "type": "error",
                    "message": str(e)
                }, session_id)
    
    except WebSocketDisconnect:
        manager.disconnect(session_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(session_id)


