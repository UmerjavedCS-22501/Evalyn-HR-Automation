import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import sys

# Add backend to path to import models
sys.path.append(os.path.join(os.getcwd(), "backend"))
from app.models.job import Job

load_dotenv("backend/.env")
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
    jobs = db.query(Job).all()
    print(f"Total jobs found: {len(jobs)}")
    for job in jobs:
        print(f"ID: {job.id} | Title: {job.title}")
except Exception as e:
    print(f"Error: {e}")
finally:
    db.close()
