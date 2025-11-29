from openai import AsyncOpenAI
from app.config import settings
from app.services.rag_engine import rag_engine
from typing import List, Dict, Optional
import logging
import uuid

logger = logging.getLogger(__name__)

class PrecomputeAgent:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def precompute_answer(
        self,
        predicted_question: str,
        topics: List[str],
        rag_docs: List[str]
    ) -> Dict:
        """
        Generate a full answer BEFORE the user asks the question.
        Uses RAG context from preloaded documents.
        """
        if not settings.PRECOMPUTE_ENABLED:
            return {
                "ready_answer": None,
                "tokens": 0,
                "context_used": []
            }
        
        try:
            # Get RAG context from documents
            rag_context = ""
            context_docs = []
            
            if rag_docs:
                # Get documents by name
                docs = rag_engine.get_documents_by_names(rag_docs)
                for doc in docs[:3]:  # Limit to top 3 docs
                    rag_context += f"\n\n{doc.get('text', '')[:1000]}"  # Limit context length
                    doc_name = doc.get("metadata", {}).get("name", "")
                    if doc_name:
                        context_docs.append(doc_name)
            
            # If no specific docs, search by question
            if not rag_context:
                search_results = rag_engine.search(predicted_question, k=3)
                for result in search_results:
                    rag_context += f"\n\n{result.get('text', '')[:1000]}"
                    doc_name = result.get("metadata", {}).get("name", "")
                    if doc_name:
                        context_docs.append(doc_name)
            
            if not self.client:
                return {
                    "ready_answer": f"Based on the context about {', '.join(topics[:2])}, here's a comprehensive answer...",
                    "tokens": 100,
                    "context_used": context_docs
                }
            
            # Generate answer using LLM
            system_prompt = """You are a helpful AI assistant. Generate a comprehensive, accurate answer to the user's question based on the provided context. 
Be concise but thorough. If the context doesn't fully answer the question, acknowledge that and provide the best answer possible."""
            
            user_prompt = f"""Question: {predicted_question}

Relevant Context:
{rag_context[:3000] if rag_context else "No specific context available, but provide a general answer."}

Generate a comprehensive answer to this question."""

            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=settings.LLM_TEMPERATURE,
                max_tokens=1000
            )
            
            answer = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if response.usage else 0
            
            return {
                "ready_answer": answer,
                "tokens": tokens_used,
                "context_used": context_docs
            }
            
        except Exception as e:
            logger.error(f"Error precomputing answer: {e}")
            return {
                "ready_answer": None,
                "tokens": 0,
                "context_used": []
            }

precompute_agent = PrecomputeAgent()


