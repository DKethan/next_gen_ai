from openai import AsyncOpenAI
from app.config import settings
from typing import List, Dict, Optional
import logging
import json

logger = logging.getLogger(__name__)

class ContextAnalyzer:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def analyze_user_context(self, recent_conversations: List[Dict]) -> Dict:
        """
        Analyze user's recent conversations to determine:
        - Activity type (studying, coding, working, etc.)
        - Topics they're working on
        - Context for personalized welcome message
        """
        if not self.client or not recent_conversations:
            return {
                "activity_type": "general",
                "topics": [],
                "welcome_message": "How can I help you today?",
                "context": "general"
            }
        
        try:
            # Get last 5 conversations' messages
            all_messages = []
            for conv in recent_conversations[-5:]:
                messages = conv.get("messages", [])
                for msg in messages:
                    if msg.get("role") == "user":
                        all_messages.append(msg.get("content", ""))
            
            if not all_messages:
                return {
                    "activity_type": "general",
                    "topics": [],
                    "welcome_message": "How can I help you today?",
                    "context": "general"
                }
            
            # Analyze context
            context_text = "\n".join(all_messages[-20:])  # Last 20 user messages
            
            prompt = f"""Analyze the user's recent conversation history and determine:

1. What activity are they primarily engaged in? (studying, coding, working, researching, learning, etc.)
2. What specific topics or subjects are they working on?
3. What is their current focus or goal?

Recent user messages:
{context_text[:2000]}

Return a JSON object with this structure:
{{
  "activity_type": "studying|coding|working|researching|learning|general",
  "topics": ["topic1", "topic2", "topic3"],
  "current_focus": "brief description of what they're currently focused on",
  "welcome_message": "personalized welcome message based on their activity and topics",
  "suggested_questions": ["question1", "question2", "question3"]
}}

Only return valid JSON, no additional text."""

            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert at analyzing user context and activity patterns. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            return {
                "activity_type": result.get("activity_type", "general"),
                "topics": result.get("topics", []),
                "current_focus": result.get("current_focus", ""),
                "welcome_message": result.get("welcome_message", "How can I help you today?"),
                "suggested_questions": result.get("suggested_questions", [])
            }
            
        except Exception as e:
            logger.error(f"Error analyzing user context: {e}")
            return {
                "activity_type": "general",
                "topics": [],
                "welcome_message": "How can I help you today?",
                "context": "general"
            }

context_analyzer = ContextAnalyzer()


