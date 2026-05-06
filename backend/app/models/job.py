from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.db.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True) # ID of the HR/Recruiter who created it
    title = Column(String, index=True)

    department = Column(String, nullable=True)
    location = Column(String, nullable=True)
    type = Column(String, nullable=True)
    experience = Column(String, nullable=True)
    description = Column(Text)
    responsibilities = Column(Text, nullable=True)
    qualifications = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)
    min_salary = Column(Integer, nullable=True)
    max_salary = Column(Integer, nullable=True)
    currency = Column(String, nullable=True)
    period = Column(String, nullable=True)
    salary_note = Column(Text, nullable=True)
    approval_status = Column(String, default="Draft")
    manager_feedback = Column(Text, nullable=True)
