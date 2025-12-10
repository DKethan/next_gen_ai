from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from openai import AsyncOpenAI
from app.config import settings
from app.services.rag_engine import rag_engine
from app.services.cache import CacheManager
from app.db.mongo import get_database
from app.models.chat_session import Message, ChatSession
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class ChatRequest(BaseModel):
    session_id: str
    message: str
    use_precomputed: bool = True

class ChatResponse(BaseModel):
    response: str
    used_precomputed: bool = False
    precomputed_answer_id: Optional[str] = None

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Handle chat messages. If a precomputed answer exists with high confidence,
    use it for instant response. Otherwise, generate answer normally with RAG.
    """
    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        
        db = await get_database()
        
        # Get or create session
        session = await db.chat_sessions.find_one({"session_id": request.session_id})
        
        # Add user message to session
        user_message = {
            "role": "user",
            "content": request.message,
            "timestamp": datetime.utcnow()
        }
        
        if session:
            await db.chat_sessions.update_one(
                {"session_id": request.session_id},
                {
                    "$push": {"messages": user_message},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            messages = session.get("messages", [])
            messages.append(user_message)
        else:
            new_session = {
                "session_id": request.session_id,
                "messages": [user_message],
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            await db.chat_sessions.insert_one(new_session)
            messages = [user_message]
        
        # Check for precomputed answer if enabled
        if request.use_precomputed:
            # Get latest prediction for this session
            prediction = await db.predictions.find_one(
                {"session_id": request.session_id},
                sort=[("created_at", -1)]
            )
            
            if prediction:
                predicted_question = prediction.get("predicted_question", "")
                confidence = prediction.get("confidence", 0)
                precomputed_answer_id = prediction.get("precomputed_answer_id")
                
                # Check if user's question matches predicted question (simple similarity)
                if confidence >= settings.PREDICTION_CONFIDENCE_THRESHOLD and precomputed_answer_id:
                    # Simple check: if question is similar enough
                    question_similarity = _calculate_similarity(request.message.lower(), predicted_question.lower())
                    
                    if question_similarity > 0.6:  # 60% similarity threshold
                        cached_answer = await CacheManager.get_precomputed_answer(precomputed_answer_id)
                        if cached_answer:
                            answer = cached_answer.get("answer", "")
                            
                            # Add assistant message to session
                            assistant_message = {
                                "role": "assistant",
                                "content": answer,
                                "timestamp": datetime.utcnow()
                            }
                            await db.chat_sessions.update_one(
                                {"session_id": request.session_id},
                                {
                                    "$push": {"messages": assistant_message},
                                    "$set": {"updated_at": datetime.utcnow()}
                                }
                            )
                            
                            return ChatResponse(
                                response=answer,
                                used_precomputed=True,
                                precomputed_answer_id=precomputed_answer_id
                            )
        
        # Generate answer using RAG + LLM
        if not client:
            # Fallback response
            answer = f"I understand you're asking: {request.message}. This is a placeholder response. Please configure OpenAI API key for full functionality."
        else:
            # Get RAG context
            rag_results = rag_engine.search(request.message, k=settings.RAG_TOP_K)
            rag_context = "\n\n".join([r.get("text", "") for r in rag_results[:3]])
            
            # Prepare messages for LLM
            system_prompt = """You are a helpful AI assistant. Answer questions based on the provided context. 
If the context doesn't fully answer the question, use your knowledge to provide a helpful response."""
            
            user_prompt = f"""Context:
{rag_context[:2000] if rag_context else "No specific context available."}

User Question: {request.message}

Provide a comprehensive answer."""
            
            # Include conversation history
            conversation_messages = [
                {"role": "system", "content": system_prompt}
            ]
            
            # Add last few messages for context
            for msg in messages[-5:]:
                conversation_messages.append({
                    "role": msg.get("role", "user"),
                    "content": msg.get("content", "")
                })
            
            conversation_messages.append({"role": "user", "content": user_prompt})
            
            response = await client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=conversation_messages,
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=1000
            )
            
            answer = response.choices[0].message.content
        
        # Add assistant message to session
        assistant_message = {
            "role": "assistant",
            "content": answer,
            "timestamp": datetime.utcnow()
        }
        await db.chat_sessions.update_one(
            {"session_id": request.session_id},
            {
                "$push": {"messages": assistant_message},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return ChatResponse(
            response=answer,
            used_precomputed=False
        )
        
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        error_msg = str(e)
        # Check if it's an OpenAI API key error
        if "invalid_api_key" in error_msg or "Incorrect API key" in error_msg or "401" in error_msg:
            raise HTTPException(
                status_code=401, 
                detail="Invalid OpenAI API key. Please check your OPENAI_API_KEY in the .env file."
            )
        raise HTTPException(status_code=500, detail=f"Error: {error_msg}")

def _calculate_similarity(str1: str, str2: str) -> float:
    """Simple similarity calculation based on common words"""
    words1 = set(str1.split())
    words2 = set(str2.split())
    
    if not words1 or not words2:
        return 0.0
    
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    
    return len(intersection) / len(union) if union else 0.0

@router.get("/chat/session/{session_id}")
async def get_session(session_id: str):
    """Get chat session history"""
    try:
        db = await get_database()
        session = await db.chat_sessions.find_one({"session_id": session_id})
        
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Convert datetime objects to ISO strings
        def serialize_datetime(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            return obj
        
        messages = session.get("messages", [])
        # Serialize timestamps in messages
        serialized_messages = []
        for msg in messages:
            serialized_msg = {**msg}
            if "timestamp" in serialized_msg and isinstance(serialized_msg["timestamp"], datetime):
                serialized_msg["timestamp"] = serialized_msg["timestamp"].isoformat()
            serialized_messages.append(serialized_msg)
        
        return {
            "session_id": session.get("session_id"),
            "messages": serialized_messages,
            "created_at": serialize_datetime(session.get("created_at")),
            "updated_at": serialize_datetime(session.get("updated_at"))
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/sessions")
async def list_sessions(limit: int = 50):
    """List all chat sessions"""
    try:
        db = await get_database()
        sessions = await db.chat_sessions.find(
            {},
            {"session_id": 1, "messages": 1, "created_at": 1, "updated_at": 1}
        ).sort("updated_at", -1).limit(limit).to_list(length=limit)
        
        result = []
        for session in sessions:
            messages = session.get("messages", [])
            last_message = messages[-1] if messages else None
            
            # Convert datetime objects to ISO strings
            created_at = session.get("created_at")
            updated_at = session.get("updated_at")
            if isinstance(created_at, datetime):
                created_at = created_at.isoformat()
            if isinstance(updated_at, datetime):
                updated_at = updated_at.isoformat()
            
            result.append({
                "session_id": session.get("session_id"),
                "title": messages[0].get("content", "New Conversation")[:50] if messages else "New Conversation",
                "last_message": last_message.get("content", "") if last_message else "",
                "message_count": len(messages),
                "created_at": created_at,
                "updated_at": updated_at,
                "messages": messages  # Include messages for context analysis
            })
        
        return {"sessions": result}
        
    except Exception as e:
        logger.error(f"Error listing sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/chat/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session"""
    try:
        db = await get_database()
        result = await db.chat_sessions.delete_one({"session_id": session_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return {"message": "Session deleted successfully", "session_id": session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/user-context")
async def get_user_context():
    """Analyze user's context from recent conversations"""
    try:
        from app.services.context_analyzer import context_analyzer
        
        db = await get_database()
        # Get last 5 sessions
        sessions = await db.chat_sessions.find(
            {},
            {"session_id": 1, "messages": 1, "created_at": 1, "updated_at": 1}
        ).sort("updated_at", -1).limit(5).to_list(length=5)
        
        # Prepare conversations for analysis
        conversations = []
        for session in sessions:
            conversations.append({
                "session_id": session.get("session_id"),
                "messages": session.get("messages", []),
                "updated_at": session.get("updated_at")
            })
        
        # Analyze context
        context = await context_analyzer.analyze_user_context(conversations)
        
        return context
        
    except Exception as e:
        logger.error(f"Error getting user context: {e}")
        # Return default context on error
        return {
            "activity_type": "general",
            "topics": [],
            "welcome_message": "How can I help you today?",
            "current_focus": "",
            "suggested_questions": []
        }

