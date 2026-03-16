# 🏆 ArticleArena: AI-Powered Competition & Evaluation Platform

**ArticleArena** is a sophisticated full-stack application designed to streamline article competitions. It leverages cutting-edge AI to provide instant, objective scoring and feedback, alongside a premium administrative suite for managing submissions and real-time leaderboards.

---

## ✨ Features

### 👤 For Competitors
- **Seamless Submissions**: Direct text entry or file uploads (PDF, DOCX, TXT).
- **Instant AI Feedback**: Receive detailed scoring (0-100) and constructive critiques within seconds of submission.
- **Dynamic Results**: Track your performance and view historical scores in a sleek, glassmorphic interface.
- **Global Rankings**: Compare your work against others in real-time competition leaderboards.

### 🛡️ For Admins
- **Command Center**: A centralized dashboard to oversee all active competitions and pending evaluations.
- **Automated Scoring**: Trigger Google Gemini-powered evaluations with a single click.
- **Manual Overrides**: Evaluate submissions manually with custom scores and feedback when needed.
- **Competition Management**: Easily create and configure new writing challenges with specific guidelines.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **State Management**: Redux Toolkit (RTK)
- **Data Fetching**: RTK Query (with automated cache invalidation and polling)
- **Styling**: Tailwind CSS & Glassmorphism
- **Animations**: Anime.js

### Backend
- **API Framework**: FastAPI (Python)
- **Database**: PostgreSQL (hosted on Supabase)
- **ORM**: SQLAlchemy
- **Migrations**: Alembic
- **AI Integration**: Google Generative AI (Gemini 1.5 Flash)

---

## 🛠️ Setup & Installation

### 1. Prerequisites
- Python 3.10+
- Node.js 20+
- Supabase Account
- Google Gemini API Key

### 2. Backend Configuration
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="your_supabase_postgresql_url"
OPENAI_API_KEY="your_gemini_api_key"
```
Run migrations and start the server:
```bash
alembic upgrade head
uvicorn app.main:app --reload
```

### 3. Frontend Configuration
```bash
cd frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:8000/api/v1"
```
Start the development server:
```bash
npm run dev
```

---

## 📈 Recent Improvements
- **Global Pending View**: Admins can now manage all pending submissions across all competitions from one view.
- **Auto-Sync Leaderboards**: Rankings now update automatically without page refreshes using RTK Query polling.
- **Enterprise UI**: Enhanced glassmorphic design with smooth micro-animations.

---

## 📄 License
This project is licensed under the MIT License.
