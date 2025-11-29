from openai import AsyncOpenAI
from app.config import settings
from app.services.rag_engine import rag_engine
from typing import List, Dict
import logging
import json

logger = logging.getLogger(__name__)

class NextAgent:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def expand_topics(self, predicted_question: str) -> List[str]:
        """Expand predicted question into topic clusters"""
        if not self.client:
            return self._extract_keywords(predicted_question)
        
        try:
            prompt = f"""Given this predicted question: "{predicted_question}"

Extract and expand into 3-5 key topics or concepts that would be relevant for answering this question.

Return a JSON object with a "topics" field containing an array of topic strings:
{{"topics": ["topic1", "topic2", "topic3"]}}

Only return the JSON object, no additional text."""

            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert at extracting and expanding topics from questions. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            topics = result.get("topics", [])
            return topics if isinstance(topics, list) else []
            
        except Exception as e:
            logger.error(f"Error expanding topics: {e}")
            return self._extract_keywords(predicted_question)
    
    async def plan_rag_documents(self, predicted_question: str, topics: List[str]) -> List[str]:
        """Determine which documents to preload for RAG"""
        try:
            # Search RAG engine for relevant documents
            search_query = f"{predicted_question} {' '.join(topics)}"
            results = rag_engine.search(search_query, k=settings.RAG_TOP_K)
            
            # Extract document names from metadata
            doc_names = []
            for result in results:
                doc_name = result.get("metadata", {}).get("name", "")
                if doc_name:
                    doc_names.append(doc_name)
            
            return doc_names
            
        except Exception as e:
            logger.error(f"Error planning RAG documents: {e}")
            return []
    
    def _extract_keywords(self, text: str) -> List[str]:
        """Simple keyword extraction fallback"""
        # Basic keyword extraction
        stop_words = {"the", "a", "an", "is", "are", "was", "were", "do", "does", "did", "how", "what", "why", "when", "where"}
        words = text.lower().split()
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        return keywords[:5]

next_agent = NextAgent()

