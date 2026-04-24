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

    # Relationship to Job
    job = relationship("Job", backref="applications")
