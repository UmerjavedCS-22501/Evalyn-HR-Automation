import os
import json
import datetime as dt
import requests
import urllib.parse
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from fastapi import HTTPException

# Scopes needed for Google Calendar API
SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
]

# Pakistan Standard Time offset (UTC+5)
TIMEZONE = "Asia/Karachi"

# Load client secret file path
CLIENT_SECRETS_FILE = os.path.join(os.path.dirname(__file__), '../../client_secret.json')


def get_google_auth_url():
    """Generates the authorization URL for Google OAuth manually to avoid PKCE issues."""
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise HTTPException(status_code=500, detail="client_secret.json not found")

    with open(CLIENT_SECRETS_FILE, 'r') as f:
        config = json.load(f)

    web_config = config.get('web', {})
    auth_uri = web_config.get('auth_uri', 'https://accounts.google.com/o/oauth2/auth')

    params = {
        'client_id': web_config.get('client_id'),
        'redirect_uri': 'http://localhost:3000/api/auth/callback/google',
        'response_type': 'code',
        'scope': ' '.join(SCOPES),
        'access_type': 'offline',
        'include_granted_scopes': 'true',
        'prompt': 'consent',
        'state': 'evalyn_' + str(dt.datetime.now().timestamp())
    }

    auth_url = f"{auth_uri}?{urllib.parse.urlencode(params)}"
    print(f"--- AUTH URL GENERATED ---")
    print(auth_url)
    print(f"--------------------------")
    return auth_url


def exchange_code_for_credentials(code: str):
    """Exchanges an authorization code for OAuth credentials using direct POST."""
    if not os.path.exists(CLIENT_SECRETS_FILE):
        raise HTTPException(status_code=500, detail="client_secret.json not found")

    with open(CLIENT_SECRETS_FILE, 'r') as f:
        config = json.load(f)

    web_config = config.get('web', {})
    token_url = web_config.get('token_uri', 'https://oauth2.googleapis.com/token')

    data = {
        'code': code,
        'client_id': web_config.get('client_id'),
        'client_secret': web_config.get('client_secret'),
        'redirect_uri': 'http://localhost:3000/api/auth/callback/google',
        'grant_type': 'authorization_code'
    }

    print(f"--- TOKEN EXCHANGE ATTEMPT ---")
    print(f"URL: {token_url}")
    print(f"Payload: {json.dumps(data, indent=2)}")

    response = requests.post(token_url, data=data)
    
    print(f"Response Status: {response.status_code}")
    print(f"Response Body: {response.text}")
    print(f"------------------------------")

    if response.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Token exchange failed: {response.text}")

    tokens = response.json()

    return {
        'token': tokens.get('access_token'),
        'refresh_token': tokens.get('refresh_token'),
        'token_uri': token_url,
        'client_id': web_config.get('client_id'),
        'client_secret': web_config.get('client_secret'),
        'scopes': tokens.get('scope', '').split(' ')
    }


def credentials_to_dict(credentials):
    """Helper function to convert Credentials object to dictionary."""
    return {
        'token': credentials.token,
        'refresh_token': credentials.refresh_token,
        'token_uri': credentials.token_uri,
        'client_id': credentials.client_id,
        'client_secret': credentials.client_secret,
        'scopes': credentials.scopes
    }


def _get_refreshed_service(credentials_json: str):
    """Builds Google Calendar service, refreshing token if expired."""
    if not credentials_json:
        raise ValueError("No credentials provided")

    creds_dict = json.loads(credentials_json)
    credentials = Credentials(
        token=creds_dict.get('token'),
        refresh_token=creds_dict.get('refresh_token'),
        token_uri=creds_dict.get('token_uri'),
        client_id=creds_dict.get('client_id'),
        client_secret=creds_dict.get('client_secret'),
        scopes=creds_dict.get('scopes'),
    )

    # Refresh if expired
    if credentials.expired and credentials.refresh_token:
        credentials.refresh(Request())

    service = build('calendar', 'v3', credentials=credentials)
    return service


def get_calendar_service(credentials_json: str):
    """Builds and returns the Google Calendar API service using credentials."""
    return _get_refreshed_service(credentials_json)


def list_upcoming_events(credentials_json: str, max_results: int = 10):
    """Fetches upcoming events from the user's primary calendar."""
    service = _get_refreshed_service(credentials_json)

    now = dt.datetime.utcnow().isoformat() + 'Z'

    events_result = service.events().list(
        calendarId='primary',
        timeMin=now,
        maxResults=max_results,
        singleEvents=True,
        orderBy='startTime'
    ).execute()

    return events_result.get('items', [])


def create_interview_event(
    credentials_json: str,
    candidate_name: str,
    candidate_email: str,
    job_title: str,
    interview_date: dt.date,
    interview_time_str: str,
    ats_score: int
) -> dict:
    """
    Creates a Google Calendar event for the scheduled interview.

    interview_date    : a datetime.date object (e.g. date(2026, 4, 25))
    interview_time_str: time string like "10:30 AM" or "02:00 PM"
    """
    service = _get_refreshed_service(credentials_json)

    # Parse the time string into hours and minutes
    time_obj = dt.datetime.strptime(interview_time_str, "%I:%M %p")
    start_dt = dt.datetime(
        interview_date.year,
        interview_date.month,
        interview_date.day,
        time_obj.hour,
        time_obj.minute,
    )
    end_dt = start_dt + dt.timedelta(hours=1)

    event_body = {
        "summary": f"Interview: {candidate_name} — {job_title}",
        "description": (
            f"Candidate: {candidate_name}\n"
            f"Email: {candidate_email}\n"
            f"Position: {job_title}\n"
            f"ATS Score: {ats_score}%\n\n"
            f"Scheduled automatically by Evalyn AI Hiring Platform."
        ),
        "start": {
            "dateTime": start_dt.isoformat(),
            "timeZone": TIMEZONE,
        },
        "end": {
            "dateTime": end_dt.isoformat(),
            "timeZone": TIMEZONE,
        },
        "attendees": [
            {"email": candidate_email, "displayName": candidate_name},
        ],
        # Colorful event: Blueberry = 9, Grape = 3, Flamingo = 4, Banana = 5
        "colorId": "9",
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email", "minutes": 60 * 24},   # 1 day before
                {"method": "popup", "minutes": 30},         # 30 min before
            ],
        },
    }

    created_event = service.events().insert(
        calendarId='primary',
        body=event_body,
        sendUpdates='all'  # Sends invite email to attendees via Google too
    ).execute()

    print(f"Calendar event created: {created_event.get('htmlLink')}")
    return created_event
