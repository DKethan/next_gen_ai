#!/usr/bin/env python3
"""
Script to initialize the RAG system with sample documents.
Run this after starting the backend to populate the vector store.
"""

import sys
import os
import asyncio
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.rag_engine import rag_engine
from app.services.embeddings import embedding_service

def load_sample_documents():
    """Load sample documents from the data/documents directory"""
    documents_path = Path(__file__).parent.parent / "data" / "documents"
    
    documents = []
    
    if not documents_path.exists():
        print(f"Documents directory not found: {documents_path}")
        return documents
    
    for file_path in documents_path.glob("*.md"):
        print(f"Loading {file_path.name}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            documents.append({
                "text": content,
                "metadata": {"name": file_path.name, "type": "markdown"}
            })
    
    for file_path in documents_path.glob("*.txt"):
        print(f"Loading {file_path.name}...")
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            documents.append({
                "text": content,
                "metadata": {"name": file_path.name, "type": "text"}
            })
    
    return documents

def chunk_text(text, chunk_size=1000):
    """Split text into chunks"""
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    
    return chunks

def main():
    """Initialize RAG system with sample documents"""
    print("Initializing RAG system...")
    
    documents = load_sample_documents()
    
    if not documents:
        print("No documents found. Please add documents to backend/data/documents/")
        return
    
    print(f"\nFound {len(documents)} document(s)")
    
    all_chunks = []
    all_metadata = []
    
    for doc in documents:
        chunks = chunk_text(doc["text"])
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_metadata.append({
                **doc["metadata"],
                "chunk_index": i,
                "total_chunks": len(chunks)
            })
    
    print(f"Total chunks: {len(all_chunks)}")
    print("Adding to vector store...")
    
    rag_engine.add_documents(all_chunks, all_metadata)
    
    print(f"✓ Successfully indexed {len(all_chunks)} chunks from {len(documents)} documents")
    print(f"✓ Vector store now contains {rag_engine.index.ntotal} vectors")

if __name__ == "__main__":
    main()


