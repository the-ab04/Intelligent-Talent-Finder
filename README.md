# 🧠 Talent Finder

AI-powered resume ranking and matching system that allows users to upload resumes and match them to job descriptions using semantic search, advanced filters, and a modern UI.

---

## 🚀 Features

* 📄 Upload and parse resumes (PDF/DOCX)
* 🤖 AI-powered semantic search (Instructor model)
* 🔍 Top-k matching resumes with similarity scores
* 🔐 JWT-based authentication
* 🎨 Frontend with React + Tailwind CSS

---

## 🛠️ Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Frontend  | React, Tailwind CSS                           |
| Backend   | FastAPI, Pydantic                             |
| DB        | PostgreSQL                                    |
| Vector DB | Qdrant                                        |
| ML Model  | hkunlp/instructor-large (InstructorEmbedding) |
| Auth      | JWT                                           |

---

## 📁 Backend Structure

```bash
backend/
│
├── app.py                        # Main FastAPI app with startup logic & background scheduler
├── db.py                         # SQLAlchemy database session and engine setup
├── config.py                     # Environment & app configuration using Pydantic
├── models.py                     # SQLAlchemy ORM models for PostgreSQL
├── schemas.py                    # Pydantic schemas for request/response validation
├── requirements.txt              # Python dependencies
│
├── routes/                       # API route definitions
│   ├── auth.py                   # Authentication routes (login, token)
│   └── resumes.py                # Resume upload, count, and search endpoints
│
├── services/
│   ├── upload_backend/
│   │   ├── upload.py             # Custom resume parser & uploader
│   │   ├── template.py           # Jinja2 or resume format template handling
│   │   └── prompt.json           # Prompt for LLM-based resume parsing
│   ├── search_batch.py           # Batch search logic using embedding or reranking
│   ├── search_template.py        # Prompt templates for job description parsing
│   └── structured_ranking_prompt.json # LLM prompt for structured reranking
│
├── utils/
│   ├── cleanup.py                # Background task to delete expired resumes - auto delete
│   ├── jwt.py                    # JWT creation and verification logic
│   ├── qdrant_client_wrapper.py # Wrapper to initialize and manage Qdrant client
│   └── logger.py                 # Centralized logging config (used across backend)

```

---

## ⚙️ Setup Instructions

### 🔧 Backend

```bash
git clone https://github.com/Yashwanth137/LinkedIn-Talent-Finder.git
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # Windows: .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file
```

`.env` example:

```env
SECRET_KEY=your-secret
postgres_url=postgresql+psycopg2://user:password@localhost:5432/<database_name>
qdrant_host=http://localhost:6333 
embedding_dim=1024
api=your-api-key

api1=your-api-key
api2=your-api-key
```

```bash
# Start the FastAPI app
uvicorn app:app --reload
```

---

### 🌐 Frontend

```bash
cd frontend
npm install
npm run start
```

---

## 🔐 Authentication

* JWT-based login (`/auth/login`) returns token
* Include token in `Authorization` header:

```http
Authorization: Bearer <token>
```

## 📄 Documentation

📘 [Read the full documentation](https://talentfinderdocs.netlify.app/)

Includes setup, API reference, models, and usage instructions.

📄 License
MIT License