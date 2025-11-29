# Setup Guide

## Quick Start with Docker

1. **Clone and navigate to the project:**
```bash
cd next_gen_ai
```

2. **Set up environment variables:**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY
```

3. **Start all services:**
```bash
docker-compose up -d
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Local Development Setup

### Backend Setup

1. **Create virtual environment:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start MongoDB and Redis:**
```bash
# Using Docker:
docker run -d -p 27017:27017 --name mongodb mongo:7
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Or use your local installations
```

5. **Run the backend:**
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Start development server:**
```bash
npm run dev
```

## Adding Documents to RAG

### Method 1: Using the API

```bash
curl -X POST http://localhost:8000/api/v1/rag/upload \
  -F "file=@path/to/your/document.pdf"
```

### Method 2: Programmatically

You can add documents programmatically by modifying the RAG engine initialization or creating a script:

```python
from app.services.rag_engine import rag_engine

# Add documents
texts = ["Your document text here..."]
metadata = [{"name": "document_name.pdf"}]
rag_engine.add_documents(texts, metadata)
```

## Running Background Workers

### Using Celery

```bash
cd backend
celery -A app.workers.precompute_worker.celery_app worker --loglevel=info
```

### Using Docker

The Celery worker is included in `docker-compose.yml` and starts automatically.

## Testing the System

1. **Start a chat session** in the frontend
2. **Send a message** like "Tell me about solar panels"
3. **Watch for predictions** - the system will predict your next question
4. **Try the suggested question** - if confidence is high, the answer will be instant!

## Troubleshooting

### Backend won't start
- Check MongoDB and Redis are running
- Verify `.env` file has correct configuration
- Check port 8000 is not in use

### Frontend can't connect
- Verify backend is running on port 8000
- Check CORS settings in `backend/app/config.py`
- Verify API URL in frontend environment variables

### WebSocket not working
- Check WebSocket URL in frontend configuration
- Verify WebSocket route is accessible
- Check browser console for errors

### RAG not finding documents
- Ensure documents are uploaded
- Check vector store path in configuration
- Verify embeddings model is loaded

## Environment Variables

Key variables to configure:

- `OPENAI_API_KEY`: Required for LLM features
- `MONGODB_URL`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `LLM_MODEL`: Model to use (default: "gpt-4o")
- `PREDICTION_CONFIDENCE_THRESHOLD`: Minimum confidence for precomputation (default: 0.8)


