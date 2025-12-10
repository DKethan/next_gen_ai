import faiss
import numpy as np
import os
import pickle
from typing import List, Dict, Tuple
from app.services.embeddings import embedding_service
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self):
        self.index = None
        self.documents: List[Dict] = []
        self.dimension = 384  # all-MiniLM-L6-v2 dimension
        self._load_or_create_index()
    
    def _load_or_create_index(self):
        """Load existing FAISS index or create new one"""
        index_path = os.path.join(settings.VECTOR_STORE_PATH, "faiss.index")
        docs_path = os.path.join(settings.VECTOR_STORE_PATH, "documents.pkl")
        
        os.makedirs(settings.VECTOR_STORE_PATH, exist_ok=True)
        
        if os.path.exists(index_path) and os.path.exists(docs_path):
            try:
                self.index = faiss.read_index(index_path)
                with open(docs_path, "rb") as f:
                    self.documents = pickle.load(f)
                logger.info(f"Loaded FAISS index with {len(self.documents)} documents")
            except Exception as e:
                logger.error(f"Error loading index: {e}")
                self._create_new_index()
        else:
            self._create_new_index()
    
    def _create_new_index(self):
        """Create a new FAISS index"""
        self.index = faiss.IndexFlatL2(self.dimension)
        self.documents = []
        logger.info("Created new FAISS index")
    
    def add_documents(self, texts: List[str], metadata: List[Dict] = None):
        """Add documents to the vector store"""
        if metadata is None:
            metadata = [{}] * len(texts)
        
        embeddings = embedding_service.encode(texts)
        self.index.add(embeddings.astype('float32'))
        
        for i, text in enumerate(texts):
            self.documents.append({
                "text": text,
                "metadata": metadata[i] if i < len(metadata) else {}
            })
        
        self._save_index()
        logger.info(f"Added {len(texts)} documents to vector store")
    
    def search(self, query: str, k: int = None) -> List[Dict]:
        """Search for similar documents"""
        if k is None:
            k = settings.RAG_TOP_K
        
        if self.index.ntotal == 0:
            return []
        
        query_embedding = embedding_service.encode_query(query)
        query_embedding = query_embedding.reshape(1, -1).astype('float32')
        
        distances, indices = self.index.search(query_embedding, k)
        
        results = []
        for i, idx in enumerate(indices[0]):
            if idx < len(self.documents):
                results.append({
                    "text": self.documents[idx]["text"],
                    "metadata": self.documents[idx]["metadata"],
                    "distance": float(distances[0][i]),
                    "similarity": 1 - float(distances[0][i])  # Simple similarity
                })
        
        # Filter by similarity threshold
        results = [r for r in results if r["similarity"] >= settings.RAG_SIMILARITY_THRESHOLD]
        
        return results
    
    def get_documents_by_names(self, doc_names: List[str]) -> List[Dict]:
        """Retrieve documents by their names/metadata"""
        results = []
        for doc in self.documents:
            doc_name = doc.get("metadata", {}).get("name", "")
            if doc_name in doc_names:
                results.append(doc)
        return results
    
    def _save_index(self):
        """Save index and documents to disk"""
        try:
            index_path = os.path.join(settings.VECTOR_STORE_PATH, "faiss.index")
            docs_path = os.path.join(settings.VECTOR_STORE_PATH, "documents.pkl")
            
            faiss.write_index(self.index, index_path)
            with open(docs_path, "wb") as f:
                pickle.dump(self.documents, f)
        except Exception as e:
            logger.error(f"Error saving index: {e}")

rag_engine = RAGEngine()



