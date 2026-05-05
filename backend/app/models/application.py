from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"))
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    skills = Column(Text, nullable=False)
    experience = Column(String, nullable=False)
    cover_letter = Column(Text, nullable=True)
    cv_path = Column(String, nullable=False)
    ats_score = Column(Integer, nullable=True)
    ats_result_json = Column(Text, nullable=True)
    status = Column(String, default="Applied")
    salary = Column(String, nullable=True)
    offer_status = Column(String, nullable=True)  # Pending, Accepted, Rejected
    start_date = Column(String, nullable=True)
    reporting_manager = Column(String, nullable=True)
    acceptance_deadline = Column(String, nullable=True)
    
    # Onboarding Fields
    address = Column(String, nullable=True)
    cnic_number = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    emergency_contact = Column(String, nullable=True)
    bank_details = Column(Text, nullable=True)
    profile_pic_path = Column(String, nullable=True)
    cnic_doc_path = Column(String, nullable=True)
    degree_doc_path = Column(String, nullable=True)
    experience_letter_path = Column(String, nullable=True)
    policy_accepted = Column(String, default="No") # "Yes" or "No"
    training_progress = Column(Integer, default=0) # 0 to 100
    onboarding_status = Column(String, default="Pending")

    # Relationship to Job
    job = relationship("Job", backref="applications")
