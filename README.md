# NextMind 🧠

A proactive AI chat system that predicts your next question and prepares answers before you ask - delivering instant responses with zero wait time.

## ✨ Features

- **Predictive AI**: Anticipates your next question based on conversation context
- **Instant Answers**: Precomputes responses for predicted questions
- **Real-time Suggestions**: Live autocomplete suggestions as you type
- **RAG Integration**: Retrieval-Augmented Generation for accurate answers
- **WebSocket Support**: Real-time bidirectional communication
- **Session Management**: Persistent conversation history with smart cleanup
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (or Docker)
- Redis (or Docker)
- OpenAI API key

### Option 1: Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/DKethan/next_gen_ai.git
   cd next_gen_ai
   ```

2. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY
   ```

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

### Option 2: Local Development

#### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp .env.example .env
# Edit .env with your OPENAI_API_KEY

# Start MongoDB and Redis (using Docker)
docker run -d -p 27017:27017 --name mongodb mongo:7
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Start the backend
uvicorn app.main:app --reload
```

#### Frontend Setup

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
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
│   │   │   ├── predict.py      # Prediction endpoints
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
│   ├── scripts/
│   │   ├── init_rag.py          # Initialize RAG system
│   │   └── clear_all_data.py    # Clear all data
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TypingSuggestions.jsx
│   │   ├── state/               # Zustand store
│   │   ├── api/                 # API clients
│   │   └── hooks/               # Custom hooks
│   ├── package.json
│   └── vite.config.js
├── docker-compose.yml
├── README.md
└── LICENSE
```

## 🔧 Configuration

Create a `.env` file in the `backend` directory:

```env
# OpenAI API Key (Required)
OPENAI_API_KEY=your_api_key_here

# MongoDB (Optional - defaults to localhost)
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=nextmind

# Redis (Optional - defaults to localhost)
REDIS_URL=redis://localhost:6379
REDIS_DB=0

# LLM Settings (Optional)
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.7
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# RAG Settings (Optional)
RAG_TOP_K=5
RAG_SIMILARITY_THRESHOLD=0.7

# Prediction Settings (Optional)
PREDICTION_CONFIDENCE_THRESHOLD=0.8
MAX_MESSAGES_FOR_PREDICTION=5
PRECOMPUTE_ENABLED=true
```

## 📡 API Endpoints

### Chat
- `POST /api/v1/chat` - Send a chat message
- `GET /api/v1/chat/session/{session_id}` - Get session history
- `GET /api/v1/chat/sessions` - List all sessions
- `DELETE /api/v1/chat/session/{session_id}` - Delete a session
- `GET /api/v1/chat/user-context` - Get user context

### Prediction
- `POST /api/v1/predict-intent` - Predict next question

### RAG
- `POST /api/v1/rag/query` - Query RAG system
- `POST /api/v1/rag/upload` - Upload documents
- `GET /api/v1/rag/documents` - List documents

### WebSocket
- `GET /api/v1/suggestions/live/{session_id}` - Real-time suggestions

### Documentation
- `GET /docs` - Interactive API documentation (Swagger UI)
- `GET /health` - Health check endpoint

## 🛠️ Development

### Adding Documents to RAG

```bash
curl -X POST http://localhost:8000/api/v1/rag/upload \
  -F "file=@your-document.pdf"
```

Or use the initialization script:

```bash
cd backend
python scripts/init_rag.py
```

### Clearing All Data

```bash
# Using Python script
cd backend
python scripts/clear_all_data.py

# Or using shell script
./clear_all.sh
```

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 🧹 Cleanup

### Clear Frontend Storage

1. **Using helper page**: Visit http://localhost:5173/clear-storage.html
2. **Using browser console**: 
   ```javascript
   localStorage.clear()
   location.reload()
   ```

### Clear Backend Data

```bash
cd backend
python scripts/clear_all_data.py
```

## 🎨 Features in Detail

### Predictive AI
The system analyzes conversation history to predict what question you're likely to ask next, preparing the answer in advance.

### Precomputed Answers
When confidence is high (>80%), answers are generated before you ask, resulting in instant responses.

### Real-time Suggestions
As you type, the system provides live suggestions for your next question via WebSocket.

### Smart Session Management
- Automatic cleanup of empty conversations
- Persistent history across sessions
- Easy conversation switching

## 📝 License

MIT License - feel free to fork and use!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📧 Support

If you encounter any issues, please open an issue on GitHub.

## 🙏 Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [React](https://react.dev/) - UI library
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [OpenAI](https://openai.com/) - LLM provider
- [MongoDB](https://www.mongodb.com/) - Database
- [Redis](https://redis.io/) - Caching

---

**Made with ❤️ for the open source community**
