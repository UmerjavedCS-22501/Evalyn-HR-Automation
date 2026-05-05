import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def update_db():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Add phone_number column
        print("Adding phone_number column...")
        cur.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS phone_number VARCHAR;")
        
        # Add profile_pic_path column
        print("Adding profile_pic_path column...")
        cur.execute("ALTER TABLE applications ADD COLUMN IF NOT EXISTS profile_pic_path VARCHAR;")
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database updated successfully!")
    except Exception as e:
        print(f"Error updating database: {e}")

if __name__ == "__main__":
    update_db()
