#!/bin/bash

# Script to run NextMind with conda environment

echo "🚀 Starting NextMind with Conda Environment"
echo ""

# Check if conda environment exists
if ! conda env list | grep -q "next_gen_ai_001"; then
    echo "❌ Conda environment 'next_gen_ai_001' not found!"
    echo "   Please create it first: conda create -n next_gen_ai_001 python=3.11"
    exit 1
fi

# Activate conda environment
echo "📦 Activating conda environment: next_gen_ai_001"
source /opt/anaconda3/etc/profile.d/conda.sh
conda activate next_gen_ai_001

# Check if .env exists
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating .env file from template..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your OPENAI_API_KEY"
    echo ""
fi

# Check if MongoDB and Redis are running
echo "🔍 Checking MongoDB and Redis..."
if ! docker ps | grep -q "mongodb"; then
    echo "   Starting MongoDB..."
    docker run -d -p 27017:27017 --name mongodb mongo:7 2>/dev/null || docker start mongodb
fi

if ! docker ps | grep -q "redis"; then
    echo "   Starting Redis..."
    docker run -d -p 6379:6379 --name redis redis:7-alpine 2>/dev/null || docker start redis
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 To start the application:"
echo ""
echo "   Terminal 1 - Backend:"
echo "   $ conda activate next_gen_ai_001"
echo "   $ cd backend"
echo "   $ uvicorn app.main:app --reload"
echo ""
echo "   Terminal 2 - Frontend:"
echo "   $ cd frontend"
echo "   $ npm install  # First time only"
echo "   $ npm run dev"
echo ""
echo "   Then open: http://localhost:5173"
echo ""

