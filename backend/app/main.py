import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from app.routes import linkdin, job, auth, application, google_calendar
from app.config.setting import FRONTEND_URL
from app.db.database import engine, Base
from app.models.job import Job
from app.models.user import User
from app.models.application import Application

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    # Manual migration hot-fix for existing tables
    from sqlalchemy import text
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS user_id INTEGER;"))
            conn.commit()
            print("Verified user_id column in jobs table")
        except Exception as migration_error:
            print(f"Migration notice (can be ignored if column exists): {migration_error}")
except Exception as e:
    print(f"Database initialization error: {e}")


app = FastAPI(title="Evalyn - AI LinkedIn Assistant")

# Add CORS Middleware
origins = [
    FRONTEND_URL,
    "https://evalyn-hr-automation-frontend.onrender.com",
    "http://localhost:3000", # keeping for local development
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup uploads directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Serve uploads folder statically
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Root Endpoint
@app.get("/", response_class=HTMLResponse)
async def root():
    return HTMLResponse("<h1>Evalyn API is running</h1><p>Auth, Job, and Application models are initialized.</p>")

# Include Routers
app.include_router(auth.router)
app.include_router(linkdin.router)
app.include_router(job.router)
app.include_router(application.router)
app.include_router(google_calendar.router)