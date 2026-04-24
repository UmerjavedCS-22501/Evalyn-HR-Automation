import json
import os
import shutil
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.database import get_db, SessionLocal
from app.models.application import Application
from app.models.job import Job
from app.models.user import User
from app.services.email_service import send_application_email, send_interview_email, pick_interview_slot
from app.services.ats_agent import run_ats_evaluation
from app.services.google_calendar_service import create_interview_event

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
            db.commit()

            # If ATS score > 60 → send interview invite + add to Google Calendar
            if ats_score > 60:
                # Pick ONE slot shared by email + calendar
                date_obj, date_str, time_str = pick_interview_slot()

                # 1. Send interview invitation email to candidate
                send_interview_email(
                    candidate_name=app_record.full_name,
                    candidate_email=app_record.email,
                    job_title=job.title,
                    ats_score=ats_score,
                    interview_date_str=date_str,
                    interview_time=time_str,
                )

                # 2. Add event to admin's Google Calendar (DEACTIVATED PER USER REQUEST)
                # admin_user = db.query(User).filter(User.id == 1).first()
                # if admin_user and admin_user.google_credentials:
                #     try:
                #         create_interview_event(
                #             credentials_json=admin_user.google_credentials,
                #             candidate_name=app_record.full_name,
                #             candidate_email=app_record.email,
                #             job_title=job.title,
                #             interview_date=date_obj,
                #             interview_time_str=time_str,
                #             ats_score=ats_score,
                #         )
                #     except Exception as cal_err:
                #         print(f"Calendar event failed (non-fatal): {cal_err}")
                # else:
                #     print("Admin Google Calendar not linked — skipping calendar event.")

            # 3. Notify HR if ATS score > 50
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
    print(f"DEBUG: Application request received for Job ID: {job_id}")
    # 0. Check if job exists
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job position not found")

    # 1. Save the CV file
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR)

    file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{full_name.replace(' ', '_')}_{cv.filename}")
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(cv.file, buffer)

    # 2. Save Application details to DB
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

        # 3. Trigger Email Notification in Background
        # candidate_data = {
        #     "full_name": full_name,
        #     "email": email,
        #     "skills": skills,
        #     "experience": experience,
        #     "cover_letter": cover_letter,
        #     "cv_path": file_path
        # }
        # background_tasks.add_task(send_application_email, candidate_data, job.title)
        
        # 4. Trigger ATS evaluation in Background
        background_tasks.add_task(process_ats_background, new_app.id)

        return {"status": "success", "message": "Application submitted successfully!", "id": new_app.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@router.get("/all")
def get_all_applications(db: Session = Depends(get_db)):
    """Admin endpoint: returns all applications with ATS scores, grouped by job."""
    jobs = db.query(Job).all()
    result = []
    for job in jobs:
        apps = db.query(Application).filter(Application.job_id == job.id).all()
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
                "status": "Evaluated" if a.ats_score is not None else "Pending",
            })
        result.append({
            "job_id": job.id,
            "job_title": job.title,
            "total_applicants": len(applicants),
            "applicants": applicants,
        })
    return result

@router.delete("/{app_id}")
def delete_application(app_id: int, db: Session = Depends(get_db)):
    app_record = db.query(Application).filter(Application.id == app_id).first()
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")
    
    try:
        # Optionally delete the CV file too
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
