# NextMind

## What It Does
A smart AI chat that guesses your next question and prepares the answer BEFORE you ask it. Gets you instant replies!

## How It Works
1. **Predicts** what you'll ask next
2. **Precomputes** answers when confident (>80%)
3. **Shows** live suggestions as you type
4. **Delivers** instant answers from cache

## Tech Stack
- **Backend**: FastAPI (Python) + OpenAI GPT-4o
- **Frontend**: React + WebSocket
- **Database**: MongoDB + Redis cache
- **AI**: Vector search (FAISS) + embeddings

## Key Features
- ⚡ Zero-wait answers for predicted questions
- 💬 Real-time typing suggestions
- 📚 Smart document search (RAG)
- 🔄 Persistent chat history

## Links
- **GitHub**: [https://github.com/DKethan/next_gen_ai](https://github.com/DKethan/next_gen_ai)
- **Docs**: [https://www.overleaf.com/read/nqxpzfvtwpvk#3e56c1](https://www.overleaf.com/read/nqxpzfvtwpvk#3e56c1)
- **Demo**: [https://www.loom.com/share/4bcfeefd9e114926aae39a07d3634dcd](https://www.loom.com/share/4bcfeefd9e114926aae39a07d3634dcd)

## Quick Start
```bash
git clone https://github.com/DKethan/next_gen_ai
cd next_gen_ai
docker-compose up -d
```

**Made with ❤️** - Proactive AI for instant conversations!