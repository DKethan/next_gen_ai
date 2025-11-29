from sentence_transformers import SentenceTransformer
from app.config import settings
import logging
import numpy as np

logger = logging.getLogger(__name__)

class EmbeddingService:
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if self._model is None:
            try:
                logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
                self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
                logger.info("Embedding model loaded successfully")
            except Exception as e:
                logger.error(f"Error loading embedding model: {e}")
                raise
    
    def encode(self, texts: list[str] | str) -> np.ndarray:
        """Generate embeddings for text(s)"""
        if isinstance(texts, str):
            texts = [texts]
        return self._model.encode(texts, convert_to_numpy=True)
    
    def encode_query(self, query: str) -> np.ndarray:
        """Generate embedding for a query"""
        return self.encode(query)

embedding_service = EmbeddingService()


