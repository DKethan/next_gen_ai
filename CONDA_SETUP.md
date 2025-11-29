# Conda Environment Setup Guide

## ✅ Environment Created: `next_gen_ai_001`

The conda environment has been created and all dependencies are installed!

## 🚀 How to Use

### 1. Activate the Environment

```bash
conda activate next_gen_ai_001
```

### 2. Set Up Environment Variables

```bash
cd /Users/kethandosapati/Developer/personal/next_gen_ai/backend
cp .env.example .env
```

Edit `backend/.env` and add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_api_key_here
```

### 3. Start MongoDB and Redis

You can use Docker for these services:

```bash
# Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# Start Redis
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

Or use the docker-compose for just these services:
```bash
docker-compose up -d mongodb redis
```

### 4. Initialize RAG (Optional)

```bash
# With conda environment activated
python scripts/init_rag.py
```

### 5. Start the Backend

```bash
# Make sure you're in the backend directory
cd backend

# With conda environment activated
uvicorn app.main:app --reload
```

The backend will be available at: **http://localhost:8000**

### 6. Start the Frontend (in a new terminal)

```bash
# Open a new terminal
cd frontend
npm install  # First time only
npm run dev
```

The frontend will be available at: **http://localhost:5173**

## 📋 Quick Commands

### Activate Environment
```bash
conda activate next_gen_ai_001
```

### Deactivate Environment
```bash
conda deactivate
```

### Check Installed Packages
```bash
conda list
# or
pip list
```

### Update Packages
```bash
pip install --upgrade -r backend/requirements.txt
```

### Remove Environment (if needed)
```bash
conda deactivate
conda env remove -n next_gen_ai_001
```

## 🔍 Verify Installation

```bash
# Activate environment
conda activate next_gen_ai_001

# Check Python version
python --version  # Should show Python 3.11.x

# Test imports
python -c "import fastapi; import openai; import faiss; print('All imports successful!')"
```

## 🎯 Run the Application

1. **Terminal 1 - Backend:**
```bash
conda activate next_gen_ai_001
cd backend
uvicorn app.main:app --reload
```

2. **Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

3. **Open Browser:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🐛 Troubleshooting

### Environment not found
```bash
conda env list  # Check if environment exists
conda activate next_gen_ai_001
```

### Import errors
```bash
# Reinstall packages
conda activate next_gen_ai_001
pip install -r backend/requirements.txt --force-reinstall
```

### Port already in use
```bash
# Find what's using the port
lsof -i :8000  # Backend
lsof -i :5173  # Frontend

# Kill the process or change ports
```

## 📝 Notes

- The conda environment is located at: `/opt/anaconda3/envs/next_gen_ai_001`
- Always activate the environment before running the backend
- The frontend doesn't need the conda environment (uses Node.js)
- MongoDB and Redis can run in Docker or locally


