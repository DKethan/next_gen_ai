# NextMind 🧠

A proactive AI chat system that predicts your next question and prepares answers before you ask - delivering instant responses with zero wait time.

## ✨ Features

- **Predictive AI**: Anticipates your next question based on conversation context
- **Instant Answers**: Precomputes responses for predicted questions
- **Real-time Suggestions**: Live autocomplete suggestions as you type
- **RAG Integration**: Retrieval-Augmented Generation for accurate answers
- **WebSocket Support**: Real-time bidirectional communication
- **Session Management**: Persistent conversation history

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (or Docker)
- Redis (or Docker)
- OpenAI API key

### Option 1: Using Docker (Easiest)

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/next_gen_ai.git
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
│   │   ├── services/            # Business logic
│   │   ├── models/              # Data models
│   │   ├── db/                  # Database connections
│   │   └── workers/             # Background workers
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── state/               # State management
│   │   ├── api/                 # API clients
│   │   └── hooks/               # Custom hooks
│   ├── package.json
│   └── vite.config.js
└── docker-compose.yml
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

# LLM Settings (Optional)
LLM_MODEL=gpt-4o
LLM_TEMPERATURE=0.7
```

## 📡 API Endpoints

- `POST /api/v1/chat` - Send a chat message
- `POST /api/v1/predict-intent` - Predict next question
- `POST /api/v1/rag/query` - Query RAG system
- `POST /api/v1/rag/upload` - Upload documents
- `GET /api/v1/suggestions/live/{session_id}` - WebSocket for live suggestions
- `GET /docs` - Interactive API documentation

## 🛠️ Development

### Adding Documents to RAG

```bash
curl -X POST http://localhost:8000/api/v1/rag/upload \
  -F "file=@your-document.pdf"
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

## 📝 License

MIT License - feel free to fork and use!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

If you encounter any issues, please open an issue on GitHub.

---

**Made with ❤️ for the open source community**
