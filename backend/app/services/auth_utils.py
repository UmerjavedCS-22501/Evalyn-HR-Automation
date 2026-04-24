import bcrypt

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password using bcrypt direct implementation.
    This avoids compatibility issues between passlib and newer bcrypt versions.
    """
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """
    Generate a bcrypt hash of a plain text password using bcrypt directly.
    """
    # 1. Encode password to bytes
    password_bytes = password.encode('utf-8')
    
    # 2. Generate a salt and hash the password
    # default rounds is 12
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    
    # 3. Return as a string for DB storage
    return hashed.decode('utf-8')
