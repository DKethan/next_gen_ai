from openai import AsyncOpenAI
from app.config import settings
from typing import List, Dict
import logging
import json

logger = logging.getLogger(__name__)

class IntentPredictor:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def predict(self, messages: List[Dict]) -> Dict:
        """
        Predict the next question based on conversation history.
        Returns predictions with confidence scores.
        """
        if not self.client:
            logger.warning("OpenAI client not configured, using fallback prediction")
            return self._fallback_predict(messages)
        
        try:
            # Get the most recent messages, prioritizing the assistant's last response
            recent_messages = messages[-settings.MAX_MESSAGES_FOR_PREDICTION:]
            
            # Find the assistant's last response
            last_assistant_msg = None
            for msg in reversed(recent_messages):
                if msg.get('role') == 'assistant':
                    last_assistant_msg = msg.get('content', '')
                    break
            
            # Build context focusing on the current conversation
            context_lines = []
            for msg in recent_messages:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                context_lines.append(f"{role.upper()}: {content}")
            
            context = "\n".join(context_lines)
            
            # Create a focused prompt that emphasizes the assistant's last response
            focus_instruction = ""
            if last_assistant_msg:
                focus_instruction = f"""

IMPORTANT: The assistant just provided this response:
"{last_assistant_msg[:500]}"

Your predictions MUST be based on what the user might ask NEXT about this specific response. 
Predict questions that:
- Follow up on concepts mentioned in the assistant's response
- Ask for clarification or examples from the response
- Dive deeper into topics covered in the response
- Relate to the specific information just provided

DO NOT predict questions about unrelated topics. Focus ONLY on what follows naturally from the assistant's last response."""

            prompt = f"""Given the user's conversation history below, predict the most likely next question they will ask.

Conversation History:
{context}
{focus_instruction}

Analyze the conversation flow and predict 3 possible next questions the user might ask, ranked by likelihood.
The questions should be DIRECTLY RELATED to the assistant's most recent response.

Return a JSON object with this structure:
{{
  "predictions": [
    {{"question": "...", "confidence": 0.0-1.0}},
    {{"question": "...", "confidence": 0.0-1.0}},
    {{"question": "...", "confidence": 0.0-1.0}}
  ],
  "reasoning": "Brief explanation of why these predictions were made"
}}

Only return valid JSON, no additional text."""

            response = await self.client.chat.completions.create(
                model=settings.LLM_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert at predicting user intent and next questions in technical conversations. Always respond with valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,  # Lower temperature for more focused, context-aware predictions
                response_format={"type": "json_object"}
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Get top prediction
            top_prediction = result["predictions"][0] if result["predictions"] else {
                "question": "What else can you help me with?",
                "confidence": 0.5
            }
            
            return {
                "predicted_question": top_prediction["question"],
                "confidence": top_prediction["confidence"],
                "predictions": result["predictions"],
                "reasoning": result.get("reasoning", "")
            }
            
        except Exception as e:
            logger.error(f"Error in intent prediction: {e}")
            return self._fallback_predict(messages)
    
    def _fallback_predict(self, messages: List[Dict]) -> Dict:
        """Fallback prediction when LLM is not available"""
        last_message = messages[-1]["content"] if messages else ""
        
        return {
            "predicted_question": f"Tell me more about {last_message[:50]}...",
            "confidence": 0.5,
            "predictions": [
                {"question": f"Tell me more about {last_message[:50]}...", "confidence": 0.5}
            ],
            "reasoning": "Fallback prediction"
        }

intent_predictor = IntentPredictor()

