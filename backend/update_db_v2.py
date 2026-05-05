import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def update_db():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        cur.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS start_date VARCHAR;")
        cur.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS reporting_manager VARCHAR;")
        cur.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS acceptance_deadline VARCHAR;")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database updated with extra offer fields!")
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    update_db()
