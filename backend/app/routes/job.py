from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.job import Job
from app.services.ai_agent import generate_job_post, generate_structured_job
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class JobCreate(BaseModel):
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    type: Optional[str] = None
    experience: Optional[str] = None
    description: Optional[str] = None
    responsibilities: Optional[str] = None
    qualifications: Optional[str] = None
    skills: Optional[str] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    currency: Optional[str] = None
    period: Optional[str] = None
    salary_note: Optional[str] = None

@router.post("/generate-structure")
def get_job_structure(prompt: str):
    data = generate_structured_job(prompt)
    if "error" in data:
        raise HTTPException(status_code=500, detail=data["error"])
    
    # Also generate the full post content for preview
    data["description"] = generate_job_post(data.get("title", "Job Opportunity"), context=prompt)
    return data

@router.post("/generate-job")
def create_job(job_data: Optional[JobCreate] = Body(None), title: Optional[str] = None, db: Session = Depends(get_db)):
    # Backward compatibility: if title is passed as query param instead of body
    if not job_data and title:
        job_data = JobCreate(title=title)
    
    if not job_data:
        # Check if they sent title in body instead of query
        raise HTTPException(status_code=422, detail="Job data or title is required")

    # If description is missing, generate it using AI
    if not job_data.description:
        # Provide any available structured data as context
        context = ""
        if job_data.responsibilities:
            context += f"Responsibilities:\n{job_data.responsibilities}\n\n"
        if job_data.qualifications:
            context += f"Qualifications:\n{job_data.qualifications}\n\n"
        if job_data.skills:
            context += f"Skills:\n{job_data.skills}\n\n"
            
        job_data.description = generate_job_post(job_data.title, context=context)
    
    # Save to Database
    job = Job(
        title=job_data.title,
        department=job_data.department,
        location=job_data.location,
        type=job_data.type,
        experience=job_data.experience,
        description=job_data.description,
        responsibilities=job_data.responsibilities,
        qualifications=job_data.qualifications,
        skills=job_data.skills,
        min_salary=job_data.min_salary,
        max_salary=job_data.max_salary,
        currency=job_data.currency,
        period=job_data.period,
        salary_note=job_data.salary_note
    )

    try:
        db.add(job)
        db.commit()
        db.refresh(job)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

    return {
        "message": "Job created",
        "job": {
            "id": job.id,
            "title": job.title,
            "description": job.description
        }
    }

@router.get("/jobs/all")
def get_all_jobs(db: Session = Depends(get_db)):
    return db.query(Job).order_by(Job.id.desc()).all()

@router.get("/job/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    print(f"DEBUG: Fetching Job ID: {job_id}")
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        print(f"DEBUG: Job ID {job_id} NOT FOUND in database")
        raise HTTPException(status_code=404, detail="Job not found")
    print(f"DEBUG: Job ID {job_id} found: {job.title}")
    return job

@router.delete("/job/{job_id}")
def delete_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    try:
        db.delete(job)
        db.commit()
        return {"message": "Job deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
