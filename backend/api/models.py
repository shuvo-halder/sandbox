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
    status = Column(String, index=True) # running, completed
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    events = relationship("TelemetryEventModel", back_populates="session")
    reports = relationship("Report", back_populates="session")

class TelemetryEventModel(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    type = Column(String, index=True) # process, network, file, alert
    title = Column(String)
    description = Column(String)
    severity = Column(String)
    
    session = relationship("AnalysisSession", back_populates="events")

class Report(Base):
    __tablename__ = "reports"
    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    format = Column(String)
    file_size = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    session = relationship("AnalysisSession", back_populates="reports")

class ProcessEventModel(Base):
    __tablename__ = "process_events"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String) # create, terminate
    pid = Column(Integer)
    ppid = Column(Integer)
    process_name = Column(String)
    cpu_usage = Column(Float)
    memory_usage = Column(Integer)
    
    session = relationship("AnalysisSession", backref="process_events")

class NetworkEventModel(Base):
    __tablename__ = "network_events"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, ForeignKey("sessions.id"), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    protocol = Column(String) # TCP, UDP
    direction = Column(String) # outbound, inbound
    source_ip = Column(String)
    source_port = Column(Integer)
    destination_ip = Column(String)
    destination_port = Column(Integer)
    bytes_sent = Column(Integer)
    
    session = relationship("AnalysisSession", backref="network_events")
