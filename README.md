# Evalyn AI: Professional HR Automation Suite

Evalyn is a premium, AI-driven recruitment platform designed to streamline the entire hiring lifecycle—from job architecting and LinkedIn publishing to automated candidate evaluation and interview scheduling.

![Dashboard Preview](https://via.placeholder.com/1200x600/0f172a/ffffff?text=Evalyn+AI+Recruitment+Dashboard)

## 🚀 Key Features

### 1. AI Job Post Architect
- Generates structured, professional LinkedIn job descriptions in seconds.
- Enforces strict branding for **US Tech** and location details (**Roshen Plaza**).
- Optimizes content for LinkedIn engagement with a 150-200 word limit and professional formatting.

### 2. Intelligent ATS Evaluation
- Uses advanced AI (Llama-3 via Groq) to score candidates against job requirements.
- Provides a detailed breakdown of **Skill Match**, **Experience Match**, and **Education Match**.
- Identifies candidate strengths and potential gaps (missing skills) automatically.

### 3. LinkedIn One-Click Publishing
- Securely connect your LinkedIn profile.
- Publish jobs directly from the dashboard with session-based verification (Email/Password).
- Includes clickable "Apply Now" link cards for higher conversion.

### 4. Automated Candidate Shortlisting
- Automatically filters candidates based on custom ATS thresholds.
- Sends professional interview invitation emails to top-tier talent.
- Includes integrated WhatsApp support (**03351196422**) for candidate concerns.

### 5. Smart Integrations
- **Google Calendar**: Optional sync for scheduled interviews (Connect Now functionality).
- **Email Service**: Automated HR notifications and candidate feedback loops.

---

## 🛠️ Tech Stack

### Backend (The Brain)
- **Framework**: FastAPI (Python)
- **AI Orchestration**: LangGraph & LangChain
- **LLM**: Groq (Llama-3.3-70b-versatile)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: OAuth2 (LinkedIn & Google)

### Frontend (The Face)
- **Framework**: Next.js (React)
- **Styling**: Vanilla CSS (Modern Glassmorphism & Premium Design)
- **State Management**: React Hooks & Context API

---

## ⚙️ Installation & Setup

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirments.txt
   ```
4. Configure your `.env` file with the following keys:
   - `GROQ_API_KEY`
   - `DATABASE_URL`
   - `CLIENT_ID` / `CLIENT_SECRET` (LinkedIn)
   - `SMTP_USER` / `SMTP_PASSWORD`
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔒 Security & Privacy
- Credentials and API keys are protected via environment variables.
- Sensitive files (`.env`, `client_secret.json`) and private uploads are excluded from version control via `.gitignore`.
- Session-based verification ensures secure LinkedIn publishing.

## 📄 License
This project is proprietary and built for **US Tech** recruitment automation.

---
*Built with ❤️ by the Evalyn AI Team*
