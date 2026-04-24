import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.services.google_calendar_service import (
    get_google_auth_url,
    exchange_code_for_credentials,
    list_upcoming_events
)

router = APIRouter(prefix="/google", tags=["google_calendar"])

# In a real app, you would use a proper session/dependency to get the current authenticated user.
# For demonstration in the OAuth callback, we might need to pass a state or assume a mock user ID if not using JWTs.
# Here we add a mock user ID dependency or get it from query params for simplicity.

def get_current_user_id():
    return 1 # Replace with actual logic to extract user_id from token

@router.get("/login")
def google_login():
    """Redirects the user to Google's OAuth 2.0 server."""
    auth_url = get_google_auth_url()
    return RedirectResponse(url=auth_url)

@router.get("/callback") # Since the redirect URI is in Next.js, we can define a backend endpoint that Next.js forwards to
def google_callback(code: str = Query(...), db: Session = Depends(get_db)):
    """Handles the OAuth 2.0 callback from Google."""
    try:
        credentials_dict = exchange_code_for_credentials(code)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to exchange code: {str(e)}")
        
    # Get current user (mocked as user 1 for now, in a real scenario you would parse state or use session)
    user_id = get_current_user_id()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Save the credentials
    user.google_credentials = json.dumps(credentials_dict)
    db.commit()
    
    return {"message": "Google Calendar successfully linked!"}

@router.get("/events")
def get_events(db: Session = Depends(get_db)):
    """Fetches upcoming events for the authenticated user."""
    user_id = get_current_user_id()
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.google_credentials:
        raise HTTPException(status_code=401, detail="User not linked with Google Calendar")
        
    try:
        events = list_upcoming_events(user.google_credentials)
        return {"events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")
