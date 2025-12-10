from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional
from app.services.rag_engine import rag_engine
from app.services.cache import CacheManager
import PyPDF2
import aiofiles
import os
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class RAGQueryRequest(BaseModel):
    query: str
    top_k: Optional[int] = None

class RAGQueryResponse(BaseModel):
    results: List[dict]
    query: str

@router.post("/rag/query", response_model=RAGQueryResponse)
async def query_rag(request: RAGQueryRequest):
    """Query the RAG vector store for relevant documents"""
    try:
        # Check cache
        query_hash = CacheManager.hash_query(request.query)
        cached = await CacheManager.get_rag_context(query_hash)
        if cached:
            return RAGQueryResponse(**cached)
        
        # Search RAG engine
        k = request.top_k or settings.RAG_TOP_K
        results = rag_engine.search(request.query, k=k)
        
        response_data = {
            "results": results,
            "query": request.query
        }
        
        # Cache results
        await CacheManager.set_rag_context(query_hash, response_data)
        
        return RAGQueryResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error querying RAG: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/rag/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload and index a document in the RAG system"""
    try:
        os.makedirs(settings.DOCUMENTS_PATH, exist_ok=True)
        
        # Save file
        file_path = os.path.join(settings.DOCUMENTS_PATH, file.filename)
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        # Extract text based on file type
        text_content = ""
        metadata = {"name": file.filename, "type": file.content_type}
        
        if file.filename.endswith('.pdf'):
            # Extract text from PDF
            with open(file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                text_parts = []
                for page in pdf_reader.pages:
                    text_parts.append(page.extract_text())
                text_content = "\n\n".join(text_parts)
        elif file.filename.endswith(('.txt', '.md')):
            async with aiofiles.open(file_path, 'r') as f:
                text_content = await f.read()
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Split into chunks (simple chunking)
        chunk_size = 1000
        chunks = []
        words = text_content.split()
        
        for i in range(0, len(words), chunk_size):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
        
        # Add to vector store
        metadata_list = [{**metadata, "chunk_index": i} for i in range(len(chunks))]
        rag_engine.add_documents(chunks, metadata_list)
        
        return {
            "message": "Document uploaded and indexed successfully",
            "filename": file.filename,
            "chunks": len(chunks)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/rag/documents")
async def list_documents():
    """List all indexed documents"""
    try:
        # Get unique document names from metadata
        doc_names = set()
        for doc in rag_engine.documents:
            name = doc.get("metadata", {}).get("name", "")
            if name:
                doc_names.add(name)
        
        return {
            "documents": list(doc_names),
            "total_documents": len(rag_engine.documents)
        }
        
    except Exception as e:
        logger.error(f"Error listing documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))



