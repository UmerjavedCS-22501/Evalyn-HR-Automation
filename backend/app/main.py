import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from app.routes import linkdin, job, auth, application, google_calendar
from app.db.database import engine, Base
from app.models.job import Job
from app.models.user import User
from app.models.application import Application

# Create tables
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Database connection error: {e}")

app = FastAPI(title="Evalyn - AI LinkedIn Assistant")

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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