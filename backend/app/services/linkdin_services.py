import requests
import re
import json
from app.config.setting import CLIENT_ID, CLIENT_SECREAT, REDIRECT_URL


def get_auth_url():
    # Reverting to personal scopes only until organization API access is approved in LinkedIn portal
    scopes = ["openid", "profile", "email", "w_member_social"]
    scope_str = "%20".join(scopes)
    
    return (
        "https://www.linkedin.com/oauth/v2/authorization"
        f"?response_type=code"
        f"&client_id={CLIENT_ID}"
        f"&redirect_uri={REDIRECT_URL}"
        f"&scope={scope_str}"
        f"&prompt=login"
    )



def get_access_token(code: str):
    url = "https://www.linkedin.com/oauth/v2/accessToken"
    try:
        response = requests.post(url, data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": REDIRECT_URL,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECREAT,
        })
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e), "details": response.text if 'response' in locals() else "No response"}


def get_user_info(access_token: str):
    url = "https://api.linkedin.com/v2/userinfo"
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return {"error": str(e), "details": response.text if 'response' in locals() else "No response"}


def get_managed_organizations(access_token: str):
    # This endpoint returns a list of organizations where the user has a role
    url = "https://api.linkedin.com/v2/organizationalEntityAcls?q=roleAssignee"
    headers = {
        "Authorization": f"Bearer {access_token}",
        "X-Restli-Protocol-Version": "2.0.0"
    }
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        # Extract organizational target URNs
        orgs = []
        for element in data.get("elements", []):
            target = element.get("organizationalTarget")
            if target:
                orgs.append(target)
        return orgs
    except Exception as e:
        # Fallback to empty if not allowed or error
        return []


def post_on_linkedin(access_token: str, text: str, person_urn: str):
    url = "https://api.linkedin.com/rest/posts"

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
        "LinkedIn-Version": "202604"
    }

    # Ensure person_urn is correctly formatted
    author = person_urn if person_urn.startswith("urn:li:") else f"urn:li:person:{person_urn}"

    # Robust URL detection for any address containing 'apply'
    # We want to capture the full URL including any query params
    url_pattern = r"(https?://[^\s]+)"
    matches = re.findall(url_pattern, text)
    apply_url = None
    for m in matches:
        if "/apply" in m:
            apply_url = m.strip()
            break
    
    data = {
        "author": author,
        "commentary": text,
        "visibility": "PUBLIC",
        "distribution": {
            "feedDistribution": "MAIN_FEED"
        },
        "lifecycleState": "PUBLISHED",
        "isReshareDisabledByAuthor": False
    }

    # Only use the 'article' card if an apply URL is detected
    if apply_url:
        data["content"] = {
            "article": {
                "source": apply_url,
                "title": "Job Application Gateway | Evalyn AI",
                "description": "Professional AI-driven job application portal. Click to apply directly."
            }
        }

    try:
        response = requests.post(url, headers=headers, json=data)
        
        # Log for debugging (will show in uvicorn console)
        print(f"LinkedIn API Request Data: {json.dumps(data, indent=2)}")
        print(f"LinkedIn API Response Status: {response.status_code}")
        print(f"LinkedIn API Response Body: {response.text}")

        if response.status_code == 201:
            return {"status": "success", "id": response.headers.get("x-restli-id", "Post Created")}
        
        # If it fails with Article content (possibly due to localhost), retry as plain text
        if "content" in data and response.status_code != 201:
            print("Retrying post without Article content block due to failure...")
            del data["content"]
            response = requests.post(url, headers=headers, json=data)
            if response.status_code == 201:
                return {"status": "success", "id": response.headers.get("x-restli-id", "Post Created (Link Card Refused)")}

        return response.json()
    except Exception as e:
        return {"error": str(e), "details": response.text if 'response' in locals() else "No response"}