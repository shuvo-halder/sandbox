from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="Security Analyst")

class Sandbox(Base):
    __tablename__ = "sandboxes"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    status = Column(String) # running, stopped
    os_image = Column(String)
    cpu_limit = Column(Integer)
    memory_limit = Column(Integer)
    network_mode = Column(String)

class AnalysisSession(Base):
    __tablename__ = "sessions"
    id = Column(String, primary_key=True, index=True)
    sample_name = Column(String)
    status = Column(String) # running, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    
    events = relationship("TelemetryEventModel", back_populates="session")
    reports = relationship("Report", back_populates="session")

class TelemetryEventModel(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    type = Column(String) # process, network, file, alert
    title = Column(String)
    description = Column(String)
    severity = Column(String)
    
    session = relationship("AnalysisSession", back_populates="events")

class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"))
    format = Column(String)
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("AnalysisSession", back_populates="reports")
