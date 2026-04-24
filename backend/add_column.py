from app.db.database import engine
from sqlalchemy import text

def add_column():
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_credentials TEXT"))
        conn.commit()
    print("Column 'google_credentials' checked/added to 'users' table.")

if __name__ == "__main__":
    add_column()
