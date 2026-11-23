# EthioSign Local Setup & Development Guide

## Prerequisites
- **Node.js**: v18.0.0 or higher (Current environment: v26.1.0)
- **npm**: v9.0.0 or higher
- **Python**: 3.9 - 3.12 (For PyTorch/MediaPipe AI service) or standard browser environment

---

## 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
By default, the Vite dev server opens at `http://localhost:5173`.

---

## 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```
By default, runs on `http://localhost:5000`.

---

## 3. AI Service Setup
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs available at `http://localhost:8000/docs`.
