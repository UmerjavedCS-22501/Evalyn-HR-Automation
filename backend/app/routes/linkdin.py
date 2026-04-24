import os
from fastapi import APIRouter, Form, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from urllib.parse import unquote, urlencode
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.job import Job
from app.services.linkdin_services import get_auth_url, get_access_token, get_user_info, post_on_linkedin

router = APIRouter()

# Setup templates (Legacy, keeping for transition)
frontend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend"))
templates = Jinja2Templates(directory=frontend_dir)

@router.get("/auth/linkedin")
def linkedin_login():
    return RedirectResponse(get_auth_url())

@router.get("/auth/linkedin/callback", response_class=HTMLResponse)
def linkedin_callback(request: Request, code: str = None, error: str = None, error_description: str = None):
    # Retrieve and decode pending text and auto-post flag from cookie
    pending_text = unquote(request.cookies.get("pending_text", ""))
    auto_post = unquote(request.cookies.get("auto_post", "false"))
    
    if error:
        return RedirectResponse(f"http://localhost:3000/auth-error?error={error}&description={error_description}")

    if not code:
        return RedirectResponse("http://localhost:3000/auth-error?error=no_code")

    token_data = get_access_token(code)
    access_token = token_data.get("access_token")
    
    if not access_token:
        desc = token_data.get('error_description', 'Unknown error')
        return RedirectResponse(f"http://localhost:3000/auth-error?error=token_failed&description={desc}")
    
    profile_info = get_user_info(access_token)
    person_urn = profile_info.get("sub")
    name = profile_info.get("name", "LinkedIn User")
    email = profile_info.get("email", "")
    picture = profile_info.get("picture", "https://via.placeholder.com/60")
    
    # Redirect to Next.js success page with all data as query params
    params = {
        "access_token": access_token,
        "person_urn": person_urn,
        "name": name,
        "email": email,
        "picture": picture,
        "pending_text": pending_text
    }
    
    redirect_url = f"http://localhost:3000/success?{urlencode(params)}"
    return RedirectResponse(redirect_url)

@router.post("/post-job")
def linkedin_post_job(
    job_id: int = Form(...), 
    access_token: str = Form(...), 
    person_urn: str = Form(...),
    acc_email: str = Form(None),
    acc_password: str = Form(None),
    db: Session = Depends(get_db)
):
    # Log credentials for session trace (per user request)
    if acc_email:
        print(f"Post Job Session - Email: {acc_email}")
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        return {"status": "error", "message": "Job not found"}
    
    # Construct the professional LinkedIn post
    apply_link = f"http://localhost:3000/jobs/{job_id}/apply"
    post_text = f"{job.description}\n\n🚀 Apply Now: {apply_link}\n\n#Hiring #{job.title.replace(' ', '')} #Recruitment #Careers"
    
    result = post_on_linkedin(access_token, post_text, person_urn)
    
    if result.get("status") == "success" or "id" in result or "urn:li:" in str(result):
        return {"status": "success", "message": "Job published to LinkedIn!", "data": result}
    else:
        return {"status": "error", "message": f"Failed to Post: {result.get('message', 'Unknown error')}", "data": result}

@router.post("/auth/linkedin/post")
def linkedin_post(
    request: Request,
    access_token: str = Form(...), 
    person_urn: str = Form(...), 
    text: str = Form(...),
    acc_email: str = Form(None),
    acc_password: str = Form(None)
):
    """
    Revised to return JSON for Next.js compatibility.
    """
    # Log credentials for session trace (per user request, but not storing in DB)
    if acc_email:
        print(f"Session Posting - Email: {acc_email}")
    
    result = post_on_linkedin(access_token, text, person_urn)
    
    if result.get("status") == "success" or "id" in result or "urn:li:" in str(result):
        return {"status": "success", "message": "Post Shared Successfully!", "data": result}
    else:
        return {"status": "error", "message": f"Failed to Post: {result.get('message', 'Unknown error')}", "data": result}