from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId


class PredictionItem(BaseModel):
    question: str
    confidence: float


class Prediction(BaseModel):
    _id: Optional[str] = None
    session_id: str
    predicted_question: str
    confidence: float
    predictions: List[PredictionItem] = []
    likely_topics: List[str] = []
    required_rag_docs: List[str] = []
    precomputed_answer: Optional[str] = None
    precomputed_answer_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda v: v.isoformat()
        }


