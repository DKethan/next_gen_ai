# How to Run MindNext

## Simple Instructions

### Step 1: Activate Conda Environment
```bash
source /opt/anaconda3/etc/profile.d/conda.sh
conda activate next_gen_ai_001
```

### Step 2: Start Backend (Terminal 1)
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will run at: **http://localhost:8000**

### Step 3: Start Frontend (Terminal 2)
Open a NEW terminal window, then:
```bash
source /opt/anaconda3/etc/profile.d/conda.sh
conda activate next_gen_ai_001
cd frontend
npm run dev
```

The frontend will run at: **http://localhost:5173**

---

## Quick Start (All in One)

If you want to run both in the same terminal using background processes:

### Terminal 1 - Backend:
```bash
source /opt/anaconda3/etc/profile.d/conda.sh
conda activate next_gen_ai_001
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend:
```bash
source /opt/anaconda3/etc/profile.d/conda.sh
conda activate next_gen_ai_001
cd frontend
npm run dev
```

---

## To Stop Everything

Press `Ctrl + C` in each terminal, or run:
```bash
pkill -f "uvicorn app.main:app"
pkill -f "npm run dev"
pkill -f "vite"
```

---

## Access the App

Once both are running:
- **Frontend**: Open http://localhost:5173 in your browser
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Troubleshooting

If ports are already in use:
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```


