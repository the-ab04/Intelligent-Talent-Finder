# 🧠 Intelligent Talent Finder

AI-powered resume ranking and matching system that enables semantic search between resumes and job descriptions using vector embeddings, advanced filtering, and a modern web interface.

![Python](https://img.shields.io/badge/Python-3.9-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-blue)
![Qdrant](https://img.shields.io/badge/Qdrant-VectorDB-orange)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)

---

# 🚀 Project Overview

**Intelligent Talent Finder** is a full-stack AI-powered application designed to automate resume matching and ranking using semantic embeddings.

The system allows recruiters to:

- Upload resumes (PDF/DOCX)
- Convert resumes into vector embeddings
- Store embeddings in Qdrant vector database
- Match resumes against job descriptions
- Retrieve top-ranked candidates
- Apply filtering and ranking logic
- Automatically clean expired resumes

This project demonstrates **real-world AI system design** combining machine learning, vector search, and full-stack development.

---

## 📸 System Preview

### 📄 Resume Upload Dashboard

<p align="center">
  <img src="assets/resume_upload_dashboard.png" width="900" height="500"/>
</p>

---

### 📝 Job Description Input

<p align="center">
  <img src="assets/job_description_input.png" width="900" height="400"/>
</p>

---

### 🔍 Resume Matching Results (Sample Data)

<p align="center">
  <img src="assets/matching_results_sample.png" width="900" height="500"/>
</p>

---

# ⭐ Features

- 📄 Upload and parse resumes (PDF/DOCX)
- 🤖 AI-powered semantic search
- 🔍 Top-k resume matching
- 📊 Resume similarity scoring
- 🧹 Automatic cleanup of expired resumes
- 🔐 JWT-based authentication
- ⚡ Fast API-based backend
- 🖥 Modern React UI
- 🧠 Embedding-based ranking
- 📦 Batch search capability

---

# 🛠️ Tech Stack

| Layer | Technology |
|------|-----------|
| Frontend | React, Tailwind CSS |
| Backend | FastAPI, Pydantic |
| Database | PostgreSQL |
| Vector Database | Qdrant |
| ML Model | InstructorEmbedding (`hkunlp/instructor-large`) |
| Authentication | JWT |
| Parsing | Custom Resume Parser |
| Scheduler | Background Cleanup Tasks |

---

# 📁 Project Structure

```bash
## 📁 Project Structure

Intelligent-Talent-Finder/
│
├── frontend/
│   ├── public/                 # Static files
│   ├── src/                    # React components & pages
│   ├── package.json            # Frontend dependencies
│   ├── package-lock.json
│   ├── tailwind.config.js      # Tailwind configuration
│   ├── postcss.config.js
│   └── .gitignore
│
├── backend/
│   ├── app.py                  # Main FastAPI application
│   ├── db.py                   # Database connection setup
│   ├── config.py               # Environment configuration
│   ├── models.py               # Database models
│   ├── schemas.py              # API schemas
│   ├── requirements.txt
│
│   ├── routes/
│   │   ├── auth.py             # Authentication routes
│   │   └── resumes.py          # Resume upload & search routes
│
│   ├── services/
│   │   ├── upload_backend/
│   │   │   ├── upload.py
│   │   │   ├── template.py
│   │   │   └── prompt.json
│   │   │
│   │   ├── search_batch.py
│   │   ├── search_template.py
│   │   └── structured_ranking_prompt.json
│
│   ├── utils/
│   │   ├── cleanup.py
│   │   ├── jwt.py
│   │   ├── qdrant_client_wrapper.py
│   │   └── logger.py
│
├── assets/                     # Screenshots & diagrams
│   ├── resume_upload_dashboard.png
│   ├── job_description_input.png
│   └── matching_results_sample.png
│
├── README.md


```
---

## ⚙️ Setup Instructions

### 1️⃣ Clone Repository

```bash
git clone https://github.com/the-ab04/Intelligent-Talent-Finder.git
cd Intelligent-Talent-Finder
```

---

## 🔧 Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate environment
source venv/bin/activate

# Windows:
# .\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

---

## 🔐 Environment Configuration

Create a `.env` file inside `backend/`.

Example:

```env
SECRET_KEY=your-secret-key

postgres_url=postgresql+psycopg2://user:password@localhost:5432/database_name

qdrant_host=http://localhost:6333

embedding_dim=1024

api=your-api-key
api1=your-api-key
api2=your-api-key
```

---

## ▶️ Run Backend Server

```bash
uvicorn app:app --reload
```

Server runs at:

```
http://127.0.0.1:8000
```

API docs available at:

```
http://127.0.0.1:8000/docs
```

---

## 🌐 Frontend Setup

```bash
cd frontend

npm install

npm start
```

Frontend runs at:

```
http://localhost:3000
```

---

## 🔍 How It Works

1. User uploads resume  
2. Resume is parsed into structured text  
3. Text converted into embeddings  
4. Embeddings stored in Qdrant  
5. Job description converted into embedding  
6. Vector similarity search performed  
7. Top-k matching resumes returned  
8. Results ranked and displayed  

---

## 📊 Core Functionalities

- Resume Upload API  
- Resume Parsing Pipeline  
- Embedding Generation  
- Vector Search  
- Resume Ranking  
- Authentication System  
- Background Cleanup Scheduler  

---

## 🧪 Example Workflow

1️⃣ Upload resumes  
2️⃣ Enter job description  
3️⃣ Perform search  
4️⃣ Get ranked candidate list  

---

## 📌 Applications

This system can be used in:

- HR Recruitment Platforms  
- Resume Screening Tools  
- Talent Matching Systems  
- Hiring Automation Platforms  
- Job Recommendation Engines  

---

## 📄 License

MIT License  
