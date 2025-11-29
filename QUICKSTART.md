# 🚀 Quick Start Guide - How to Run MindNext

## Option 1: Using Docker (Easiest - Recommended)

### Step 1: Set up environment variables
```bash
cd /Users/kethandosapati/Developer/personal/next_gen_ai
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
```

### Step 2: Start all services
```bash
docker-compose up -d
```

This will start:
- MongoDB (port 27017)
- Redis (port 6379)
- Backend API (port 8000)
- Frontend (port 5173)
- Celery Worker

### Step 3: Initialize RAG with sample documents
```bash
# Wait a few seconds for services to start, then:
docker-compose exec backend python scripts/init_rag.py
```

### Step 4: Open in browser
- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### Step 5: Test it!
1. Open http://localhost:5173 in your browser
2. Type a message like "Tell me about solar panels"
3. Watch for the predicted next question to appear
4. Click the suggestion or type your own question
5. Get instant answers!

---

## Option 2: Local Development (Without Docker)

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally (or use Docker for just MongoDB)
- Redis running locally (or use Docker for just Redis)

### Backend Setup

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

# Start MongoDB and Redis (if not using Docker)
# Option A: Use Docker for just these services
docker run -d -p 27017:27017 --name mongodb mongo:7
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Start the backend
uvicorn app.main:app --reload
```

Backend will be at: http://localhost:8000

### Frontend Setup

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be at: http://localhost:5173

### Initialize RAG

```bash
# In backend directory with venv activated
python scripts/init_rag.py
```

---

## Verify Everything is Working

### Check Backend
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

### Check Frontend
Open http://localhost:5173 - you should see the MindNext interface

### Check API Docs
Open http://localhost:8000/docs - you should see Swagger UI

---

## Troubleshooting

### Port already in use
```bash
# Check what's using the port
lsof -i :8000  # Backend
lsof -i :5173  # Frontend
lsof -i :27017 # MongoDB
lsof -i :6379  # Redis

# Kill the process or change ports in docker-compose.yml
```

### Docker services not starting
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
docker-compose logs redis

# Restart services
docker-compose restart
```

### Backend can't connect to MongoDB/Redis
- Make sure MongoDB and Redis containers are running: `docker-compose ps`
- Check connection strings in `backend/.env`
- For Docker: Use service names (mongodb, redis) not localhost

### Frontend can't connect to backend
- Check backend is running: http://localhost:8000/health
- Check CORS settings in `backend/app/config.py`
- Verify API URL in frontend (should be http://localhost:8000/api/v1)

### No predictions appearing
- Make sure OpenAI API key is set correctly
- Check backend logs: `docker-compose logs backend`
- Try a simple message first: "Hello"

---

## Stop the Application

### Docker
```bash
docker-compose down
```

### Local
- Press `Ctrl+C` in terminal running backend/frontend
- Stop MongoDB/Redis if running locally

---

## Next Steps

1. **Add your own documents**:
   ```bash
   curl -X POST http://localhost:8000/api/v1/rag/upload \
     -F "file=@path/to/your/document.pdf"
   ```

2. **Customize the system**:
   - Adjust confidence thresholds in `backend/app/config.py`
   - Modify agent prompts in `backend/app/services/`
   - Customize UI in `frontend/src/components/`

3. **Monitor performance**:
   - Check API docs: http://localhost:8000/docs
   - View logs: `docker-compose logs -f`

Enjoy your proactive AI system! 🎉

