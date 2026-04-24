import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def update_schema():
    print(f"Connecting to {DATABASE_URL}...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        columns = [
            ("department", "VARCHAR"),
            ("location", "VARCHAR"),
            ("type", "VARCHAR"),
            ("experience", "VARCHAR"),
            ("responsibilities", "TEXT"),
            ("qualifications", "TEXT"),
            ("min_salary", "INTEGER"),
            ("max_salary", "INTEGER"),
            ("currency", "VARCHAR"),
            ("period", "VARCHAR"),
            ("salary_note", "TEXT")
        ]
        
        for col_name, col_type in columns:
            try:
                cur.execute(f"ALTER TABLE jobs ADD COLUMN {col_name} {col_type};")
                print(f"Added column {col_name}")
            except Exception as e:
                if "already exists" in str(e):
                    print(f"Column {col_name} already exists.")
                    conn.rollback()
                else:
                    print(f"Error adding {col_name}: {e}")
                    conn.rollback()
            else:
                conn.commit()
                
        cur.close()
        conn.close()
        print("Schema update complete.")
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    update_schema()
