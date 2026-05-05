import json
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.services.email_service import send_application_email, send_interview_email, pick_interview_slot, send_offer_letter_email
from app.services.ats_agent import run_ats_evaluation

router = APIRouter(prefix="/applications", tags=["applications"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../../uploads")

def process_ats_background(application_id: int):
    db = SessionLocal()
    try:
        app_record = db.query(Application).filter(Application.id == application_id).first()
        job = db.query(Job).filter(Job.id == app_record.job_id).first()

        if not app_record or not job:
            return

        result = run_ats_evaluation(
            job_description=job.description or job.title,
            cv_path=app_record.cv_path,
            skills=app_record.skills,
            experience=app_record.experience,
            cover_letter=app_record.cover_letter or ""
        )

        if "error" not in result:
            ats_score = result.get("ats_score", 0)
            app_record.ats_score = ats_score
            app_record.ats_result_json = json.dumps(result)
            app_record.status = "Evaluated"
            db.commit()

            # If ATS score > 60 → send interview invite
            if ats_score > 60:
                date_obj, date_str, time_str = pick_interview_slot()
                send_interview_email(
                    candidate_name=app_record.full_name,
                    candidate_email=app_record.email,
                    job_title=job.title,
                    ats_score=ats_score,
                    interview_date_str=date_str,
                    interview_time=time_str,
                )

            # Notify HR if ATS score > 50
            if ats_score > 50:
                candidate_data = {
                    "full_name": app_record.full_name,
                    "email": app_record.email,
                    "skills": app_record.skills,
                    "experience": app_record.experience,
                    "cover_letter": app_record.cover_letter,
                    "cv_path": app_record.cv_path
                }
                send_application_email(
                    candidate_data=candidate_data, 
                    job_title=job.title, 
                    ats_score=ats_score,
                    ats_summary=result.get("summary")
                )

    except Exception as e:
        print(f"Background ATS Error: {e}")
    finally:
        db.close()


@router.post("/apply/{job_id}")
async def apply_to_job(
    job_id: int,
    background_tasks: BackgroundTasks,
    full_name: str = Form(...),
    email: str = Form(...),
    skills: str = Form(...),
    experience: str = Form(...),
    cover_letter: str = Form(None),
    cv: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job position not found")

    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{full_name.replace(' ', '_')}_{cv.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(cv.file, buffer)

    new_app = Application(
        job_id=job_id,
        full_name=full_name,
        email=email,
        skills=skills,
        experience=experience,
        cover_letter=cover_letter,
        cv_path=file_path
    )

    try:
        db.add(new_app)
        db.commit()
        db.refresh(new_app)
        background_tasks.add_task(process_ats_background, new_app.id)
        return {"status": "success", "message": "Application submitted successfully!", "id": new_app.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/all")
def get_all_applications(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    result = []
    for job in jobs:
        apps = db.query(Application).filter(
            Application.job_id == job.id,
            ~Application.status.in_(["Hired", "Onboarding Completed"])
        ).all()
        if not apps:
            continue
        applicants = []
        for a in apps:
            ats_details = None
            if a.ats_result_json:
                try:
                    ats_details = json.loads(a.ats_result_json)
                except Exception:
                    ats_details = None
            applicants.append({
                "id": a.id,
                "full_name": a.full_name,
                "email": a.email,
                "skills": a.skills,
                "experience": a.experience,
                "ats_score": a.ats_score,
                "ats_details": ats_details,
                "status": a.status or ("Evaluated" if a.ats_score is not None else "Applied"),
                "salary": a.salary,
                "offer_status": a.offer_status
            })
        result.append({
            "job_id": job.id,
            "job_title": job.title,
            "total_applicants": len(applicants),
            "applicants": applicants,
        })
    return result

@router.get("/hired")
def get_hired_applications(db: Session = Depends(get_db)):
    """Admin endpoint: returns all hired applications for onboarding."""
    apps = db.query(Application).filter(Application.status.in_(["Hired", "Onboarding Completed"])).all()
    if not apps:
        return []
        
    result = []
    for a in apps:
        job = db.query(Job).filter(Job.id == a.job_id).first()
        result.append({
            "id": a.id,
            "full_name": a.full_name,
            "email": a.email,
            "job_title": job.title if job else "Position",
            "start_date": a.start_date,
            "reporting_manager": a.reporting_manager,
            "status": a.status,
            "onboarding_status": a.onboarding_status,
            "training_progress": a.training_progress
        })
    return result

@router.get("/{app_id}/onboarding")
def get_onboarding_data(app_id: int, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    job = db.query(Job).filter(Job.id == app_record.job_id).first()
    
    return {
        "id": app_record.id,
        "full_name": app_record.full_name,
        "email": app_record.email,
        "job_title": job.title if job else "Position",
        "address": app_record.address,
        "cnic_number": app_record.cnic_number,
        "phone_number": app_record.phone_number,
        "emergency_contact": app_record.emergency_contact,
        "bank_details": app_record.bank_details,
        "policy_accepted": app_record.policy_accepted,
        "training_progress": app_record.training_progress,
        "onboarding_status": app_record.onboarding_status,
        "reporting_manager": app_record.reporting_manager,
        "profile_pic": app_record.profile_pic_path,
        "docs": {
            "cnic": app_record.cnic_doc_path,
            "degree": app_record.degree_doc_path,
            "experience": app_record.experience_letter_path
        }
    }

@router.post("/{app_id}/personal-info")
def update_personal_info(app_id: int, info: dict, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if app_record.onboarding_status == "onboarding_completed":
        raise HTTPException(status_code=403, detail="Onboarding is completed and locked.")

    app_record.address = info.get("address")
    app_record.cnic_number = info.get("cnic")
    app_record.phone_number = info.get("phone_number")
    app_record.emergency_contact = info.get("emergency_contact")
    app_record.bank_details = info.get("bank_details")
    
    if app_record.onboarding_status == "Pending":
        app_record.onboarding_status = "info_completed"
    
    db.commit()
    return {"status": "success", "message": "Personal information updated"}

@router.post("/{app_id}/upload-docs")
async def upload_onboarding_docs(
    app_id: int,
    profile_pic: UploadFile = File(None),
    cnic: UploadFile = File(None),
    degree: UploadFile = File(None),
    experience: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if app_record.onboarding_status == "onboarding_completed":
        raise HTTPException(status_code=403, detail="Onboarding is completed and locked.")

    onboarding_dir = os.path.join(UPLOAD_DIR, "onboarding")
    if not os.path.exists(onboarding_dir):
        os.makedirs(onboarding_dir)
        
    for file, field in [
        (profile_pic, "profile_pic_path"),
        (cnic, "cnic_doc_path"), 
        (degree, "degree_doc_path"), 
        (experience, "experience_letter_path")
    ]:
        if file:
            file_path = os.path.join(onboarding_dir, f"{app_id}_{field}_{file.filename}")
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            setattr(app_record, field, file_path)
            
    app_record.onboarding_status = "docs_uploaded"
    db.commit()
    return {"status": "success", "message": "Documents uploaded successfully"}

@router.post("/{app_id}/accept-policy")
def accept_policy(app_id: int, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    if app_record.onboarding_status == "onboarding_completed":
        raise HTTPException(status_code=403, detail="Onboarding is completed and locked.")

    app_record.policy_accepted = "Yes"
    app_record.onboarding_status = "policy_accepted"
    db.commit()
    return {"status": "success", "message": "Policy accepted"}

@router.post("/{app_id}/update-training")
def update_training(app_id: int, progress: dict, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    new_progress = progress.get("progress", 0)
    app_record.training_progress = new_progress
    
    if new_progress >= 100:
        app_record.onboarding_status = "onboarding_completed"
        app_record.status = "Onboarding Completed"
        
    db.commit()
    return {"status": "success", "progress": new_progress}

@router.post("/{app_id}/send-onboarding-link")
def send_onboarding_link(app_id: int, db: Session = Depends(get_db)):
    from app.services.email_service import send_onboarding_email
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    job = db.query(Job).filter(Job.id == app_record.job_id).first()
    
    try:
        send_onboarding_email(
            candidate_name=app_record.full_name,
            candidate_email=app_record.email,
            job_title=job.title if job else "Position",
            application_id=app_id
        )
        return {"status": "success", "message": "Onboarding invitation sent"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{app_id}/status")
def update_application_status(app_id: int, status_update: dict, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    
    # Prevent changes if already Hired
    if app_record.status == "Hired":
        raise HTTPException(status_code=403, detail="Status is locked for hired candidates")
    
    new_status = status_update.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="Status is required")
    
    if new_status == "Hired":
        raise HTTPException(status_code=403, detail="Hired status can only be set automatically upon offer acceptance.")
    
    try:
        app_record.status = new_status
        db.commit()
        return {"status": "success", "message": f"Status updated to {new_status}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.delete("/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    
    try:
        if app_record.cv_path and os.path.exists(app_record.cv_path):
            try:
                os.remove(app_record.cv_path)
            except:
                pass
        db.delete(app_record)
        db.commit()
        return {"message": "Application deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.post("/{app_id}/send-offer")
def send_offer(app_id: int, offer_data: dict, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    
    salary = offer_data.get("salary")
    start_date = offer_data.get("start_date", "TBD")
    reporting_manager = offer_data.get("reporting_manager", "HR Manager")
    acceptance_deadline = offer_data.get("acceptance_deadline", "within 7 days")

    if not salary:
        raise HTTPException(status_code=400, detail="Salary is required")
    
    job = db.query(Job).filter(Job.id == app_record.job_id).first()
    
    try:
        app_record.salary = salary
        app_record.start_date = start_date
        app_record.reporting_manager = reporting_manager
        app_record.acceptance_deadline = acceptance_deadline
        app_record.offer_status = "Pending"
        db.commit()
        
        send_offer_letter_email(
            candidate_name=app_record.full_name,
            candidate_email=app_record.email,
            job_title=job.title if job else "Position",
            salary=salary,
            application_id=app_id,
            start_date=start_date,
            reporting_manager=reporting_manager,
            acceptance_deadline=acceptance_deadline
        )
        
        return {"status": "success", "message": "Offer letter sent successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/{app_id}/public")
def get_public_application(app_id: int, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    job = db.query(Job).filter(Job.id == app_record.job_id).first()
    
    return {
        "id": app_record.id,
        "full_name": app_record.full_name,
        "job_title": job.title if job else "Position",
        "salary": app_record.salary,
        "start_date": app_record.start_date,
        "reporting_manager": app_record.reporting_manager,
        "acceptance_deadline": app_record.acceptance_deadline,
        "offer_status": app_record.offer_status
    }

@router.post("/{app_id}/offer-response")
def offer_response(app_id: int, response_data: dict, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    
    new_offer_status = response_data.get("status")  # "Accepted" or "Rejected"
    if new_offer_status not in ["Accepted", "Rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    try:
        app_record.offer_status = new_offer_status
        if new_offer_status == "Accepted":
            app_record.status = "Hired"
        db.commit()
        return {"status": "success", "message": f"Offer {new_offer_status} successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
