# MindNext: Proactive AI That Predicts the User's Next Question

A production-grade AI system that reads conversation history, predicts what the user is thinking, and prepares responses before they type - enabling 0ms answer time, smart preloading, context-aware RAG, and autocomplete suggestions.

## 🏗️ Architecture

```
Frontend (React + Vite) → Backend (FastAPI) → Multi-Agent Pipeline → LLM Layer → Data Stores
```

### Components

- **Frontend**: React + Vite + Tailwind + Zustand + WebSockets
- **Backend**: FastAPI + Uvicorn
- **LLM**: GPT-4o or custom fine-tuned Llama-3.1 8B
- **Vector Store**: FAISS
- **Databases**: MongoDB (sessions, predictions) + Redis (cache)
- **Background Workers**: Celery for precomputation

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for local development)
- OpenAI API key (optional, for LLM features)

### Using Docker Compose (Recommended)

1. Clone the repository:
```bash
cd next_gen_ai
```

2. Create a `.env` file in the `backend` directory:
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your OPENAI_API_KEY
```

3. Start all services:
```bash
docker-compose up -d
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB and Redis (or use Docker)
# Then start the backend:
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📁 Project Structure

```
next_gen_ai/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration
│   │   ├── routes/              # API routes
│   │   │   ├── chat.py          # Chat endpoints
│   │   │   ├── predict.py       # Prediction endpoints
│   │   │   ├── rag.py           # RAG endpoints
│   │   │   └── ws.py            # WebSocket endpoints
│   │   ├── services/            # Business logic
│   │   │   ├── intent_predictor.py
│   │   │   ├── next_agent.py
│   │   │   ├── precompute_agent.py
│   │   │   ├── rag_engine.py
│   │   │   ├── embeddings.py
│   │   │   └── cache.py
│   │   ├── models/              # Data models
│   │   ├── db/                  # Database connections
│   │   └── workers/             # Background workers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── TypingSuggestions.jsx
│   │   ├── state/               # Zustand store
│   │   ├── api/                 # API clients
│   │   └── hooks/               # Custom hooks
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
```

## 🧠 Multi-Agent Pipeline

### Agent 1: Intent Predictor
Predicts the most likely next question based on conversation history.

### Agent 2: Topic Expansion Agent
Expands predicted questions into topic clusters.

### Agent 3: RAG Planner Agent
Determines which documents to preload from the vector store.

### Agent 4: Precompute Answer Agent
Generates a full answer BEFORE the user asks the question.

## 🔌 API Endpoints

### POST `/api/v1/predict-intent`
Predict the next question the user is likely to ask.

### POST `/api/v1/chat`
Send a chat message. Uses precomputed answer if available.

### POST `/api/v1/rag/query`
Query the RAG vector store for relevant documents.

### POST `/api/v1/rag/upload`
Upload and index a document in the RAG system.

### GET `/api/v1/suggestions/live/{session_id}` (WebSocket)
Real-time prediction suggestions as the user types.

## 🎨 Frontend Features

- **Real-time Suggestions**: WebSocket-powered next question predictions
- **Autocomplete**: Smart suggestions based on conversation context
- **Preloaded Answers**: Instant responses when predictions match
- **Streaming Responses**: Smooth chat experience
- **Session Management**: Persistent conversation history

## 🧪 Configuration

Key configuration options in `backend/app/config.py`:

- `PREDICTION_CONFIDENCE_THRESHOLD`: Minimum confidence to precompute answers (default: 0.8)
- `MAX_MESSAGES_FOR_PREDICTION`: Number of messages to use for prediction (default: 5)
- `RAG_TOP_K`: Number of documents to retrieve (default: 5)
- `LLM_MODEL`: LLM model to use (default: "gpt-4o")

## 📊 Database Schema

### MongoDB Collections

**chat_sessions**
```json
{
  "session_id": "abc123",
  "messages": [...],
  "created_at": "...",
  "updated_at": "..."
}
```

**predictions**
```json
{
  "session_id": "abc123",
  "predicted_question": "...",
  "confidence": 0.89,
  "precomputed_answer": "...",
  "precomputed_answer_id": "pre_94832",
  "created_at": "..."
}
```

## 🔧 Development

### Running Tests
```bash
# Backend tests (when implemented)
cd backend
pytest

# Frontend tests (when implemented)
cd frontend
npm test
```

### Adding Documents to RAG

1. Use the upload endpoint:
```bash
curl -X POST http://localhost:8000/api/v1/rag/upload \
  -F "file=@your-document.pdf"
```

2. Or add documents programmatically in the code.

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or submit a pull request.

