import os
import sys
import uuid
import datetime
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import asyncio

# Adjust path for relative imports if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from api.database import engine, Base, get_db
from api.models import User, Sandbox, AnalysisSession, TelemetryEventModel, Report
from api.schemas.event import TelemetryEvent
from api.auth import get_current_user, Token, oauth2_scheme, create_access_token
from analysis.scoring import calculate_risk_score
from pydantic import BaseModel

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="MBS API Engine", version="1.0.0")

# Setup CORS for React Dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to React dashboard domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                pass # Client disconnected

manager = ConnectionManager()

# --- INITIAL DATA SEEDING ---
def seed_db():
    db = next(get_db())
    if not db.query(Sandbox).first():
        db.add_all([
            Sandbox(id='sb-1', name='Win11-Sandbox-01', status='running', os_image='windows-11-22h2', cpu_limit=4, memory_limit=8192, network_mode='isolated'),
            Sandbox(id='sb-2', name='Win10-Sandbox-02', status='stopped', os_image='windows-10-21h2', cpu_limit=2, memory_limit=4096, network_mode='host-only'),
            Sandbox(id='sb-3', name='Ubuntu-Sandbox-01', status='running', os_image='ubuntu-22.04-lts', cpu_limit=2, memory_limit=4096, network_mode='isolated')
        ])
    if not db.query(AnalysisSession).first():
        db.add_all([
            AnalysisSession(id='sess-101', sample_name='Trojan.Win32.Agent.exe', status='completed'),
            AnalysisSession(id='sess-102', sample_name='Ransomware.WannaCry.sample', status='completed'),
            AnalysisSession(id='sess-103', sample_name='Stealer.Info.py', status='running')
        ])
    if not db.query(Report).first():
        db.add_all([
            Report(id='rep-001', session_id='sess-101', format='pdf', file_size=245000),
            Report(id='rep-002', session_id='sess-102', format='json', file_size=89000)
        ])
    db.commit()

try:
    seed_db()
except Exception:
    pass

@app.get("/api/v1/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "error"
    return {"status": "ok", "service": "MBS FastAPI Engine", "database": db_status}

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/v1/auth/login")
async def login(req: LoginRequest):
    # In a real app, verify against db User table hashed passwords
    if req.username == "sec_analyst" and req.password == "password":
        access_token = create_access_token(data={"sub": req.username})
        return {"access_token": access_token, "refresh_token": "mock-jwt-refresh"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/v1/auth/me")
async def auth_me(current_user: dict = Depends(get_current_user)):
    return current_user

@app.get("/api/v1/dashboard/stats")
async def dashboard_stats(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    sandboxes = db.query(Sandbox).all()
    sessions = db.query(AnalysisSession).all()
    reports = db.query(Report).all()
    
    # Calculate mock risk score for now
    avg_risk_score = 78
    
    return {
        "total_sandboxes": len(sandboxes),
        "active_sandboxes": sum(1 for s in sandboxes if s.status == "running"),
        "total_sessions": len(sessions),
        "avg_risk_score": avg_risk_score,
        "malicious_count": 5,
        "suspicious_count": 4,
        "benign_count": 3,
        "total_reports": len(reports)
    }

@app.get("/api/v1/dashboard/recent")
async def dashboard_recent(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    # Mocking recent activities for now
    return [
      { "type": 'Sandbox', "title": 'Win11-Sandbox-01 Started', "description": 'Execution environment ready for sample Trojan.Win32.Agent.exe', "status": 'running', "created_at": (datetime.datetime.utcnow() - datetime.timedelta(minutes=20)).isoformat() },
      { "type": 'Analysis', "title": 'Session sess-101 Completed', "description": 'Risk score calculated: 85 (Malicious)', "status": 'completed', "created_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=1)).isoformat() },
      { "type": 'Network', "title": 'Suspicious Traffic Detected', "description": 'Outbound connection to 185.220.101.5:443 flagged', "status": 'warning', "created_at": (datetime.datetime.utcnow() - datetime.timedelta(minutes=90)).isoformat() }
    ]

@app.get("/api/v1/sandboxes")
async def get_sandboxes(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    sandboxes = db.query(Sandbox).all()
    return {"items": [
        {"id": s.id, "name": s.name, "status": s.status, "os_image": s.os_image, "cpu_limit": s.cpu_limit, "memory_limit": s.memory_limit, "network_mode": s.network_mode}
        for s in sandboxes
    ]}

@app.post("/api/v1/sandboxes/{sandbox_id}/start")
async def start_sandbox(sandbox_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    sb = db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
    if not sb:
        raise HTTPException(status_code=404, detail="Sandbox not found")
    sb.status = "running"
    db.commit()
    return {"success": True, "status": "running"}

@app.post("/api/v1/sandboxes/{sandbox_id}/stop")
async def stop_sandbox(sandbox_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    sb = db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
    if not sb:
        raise HTTPException(status_code=404, detail="Sandbox not found")
    sb.status = "stopped"
    db.commit()
    return {"success": True, "status": "stopped"}

@app.get("/api/v1/analytics/sessions")
async def analytics_sessions(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    sessions = db.query(AnalysisSession).all()
    return {"items": [{"id": s.id, "sample_name": s.sample_name, "status": s.status} for s in sessions]}

@app.get("/api/v1/sessions/{session_id}/events")
async def session_events(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    events = db.query(TelemetryEventModel).filter(TelemetryEventModel.session_id == session_id).order_by(TelemetryEventModel.timestamp.desc()).all()
    return {"items": [
        {"id": e.id, "type": e.type, "title": e.title, "description": e.description, "severity": e.severity, "timestamp": e.timestamp.isoformat()}
        for e in events
    ]}

@app.get("/api/v1/analytics/risk/{session_id}")
async def analytics_risk(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    events = db.query(TelemetryEventModel).filter(TelemetryEventModel.session_id == session_id).all()
    # If no events in DB yet, fallback to mock score
    if not events:
        return {"score": 85, "classification": "malicious"}
        
    score = calculate_risk_score([{"severity": e.severity, "type": e.type} for e in events])
    classification = "malicious" if score > 66 else ("suspicious" if score > 25 else "benign")
    return {"score": score, "classification": classification}

@app.get("/api/v1/analytics/summary/{session_id}")
async def analytics_summary(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    return {
      "total_file_events": 142,
      "suspicious_files": 18,
      "total_process_events": 35,
      "total_network_events": 89,
      "suspicious_network": 12,
      "findings": [
        { "severity": 'high', "category": 'Persistence', "title": 'Registry Run Key Modification', "description": 'Sample created a persistence entry in HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' },
        { "severity": 'high', "category": 'Network', "title": 'C2 Server Communication', "description": 'Attempted TLS handshake with known malicious command & control server 185.220.101.5' },
        { "severity": 'medium', "category": 'Evasion', "title": 'Process Injection Attempt', "description": 'Injected shellcode into legitimate svchost.exe process' }
      ],
      "summary": 'High-risk malware sample exhibiting Trojan and ransomware behaviors including automated persistence setup and encrypted C2 communication.'
    }

@app.get("/api/v1/reports")
async def get_reports(db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    reports = db.query(Report).order_by(Report.created_at.desc()).all()
    return {"items": [
        {"id": r.id, "session_id": r.session_id, "format": r.format, "file_size": r.file_size, "created_at": r.created_at.isoformat()}
        for r in reports
    ]}

@app.post("/api/v1/reports/generate")
async def generate_report(req: Request, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    body = await req.json()
    new_rep = Report(
        id=f"rep-{uuid.uuid4().hex[:6]}",
        session_id=body.get("session_id", "sess-101"),
        format=body.get("format", "pdf"),
        file_size=50000 + (hash(body.get("session_id", "")) % 200000)
    )
    db.add(new_rep)
    db.commit()
    db.refresh(new_rep)
    return {"id": new_rep.id, "session_id": new_rep.session_id, "format": new_rep.format, "file_size": new_rep.file_size, "created_at": new_rep.created_at.isoformat()}

@app.post("/api/v1/events", status_code=status.HTTP_201_CREATED)
async def ingest_event(event: TelemetryEvent, db: Session = Depends(get_db)):
    """
    Ingest telemetry event from Go Collector, save to DB, evaluate risk, 
    and broadcast to React dashboard via WebSockets.
    """
    # 1. Save to database
    db_event = TelemetryEventModel(
        session_id=event.session_id,
        timestamp=event.timestamp,
        type=event.type,
        title=event.title,
        description=event.description,
        severity=event.severity
    )
    db.add(db_event)
    db.commit()
    
    # 2. Recalculate deterministic risk score for session
    all_events = db.query(TelemetryEventModel).filter(TelemetryEventModel.session_id == event.session_id).all()
    current_score = calculate_risk_score([{"severity": e.severity, "type": e.type} for e in all_events])
    
    # 3. Broadcast to React frontend
    broadcast_data = event.model_dump_json()
    asyncio.create_task(manager.broadcast(broadcast_data))
    
    return {"status": "ingested", "risk_score": current_score}

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time telemetry streaming to React.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, wait for client messages if any
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@app.get("/api/v1/sessions/{session_id}/processes")
async def session_processes(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    now = datetime.datetime.utcnow()
    return {
      "items": [
        { "timestamp": now.isoformat(), "event_type": 'create', "pid": 1042, "ppid": 408, "process_name": 'malware_sample.exe', "cpu_usage": 14.5, "memory_usage": 45000 },
        { "timestamp": (now - datetime.timedelta(seconds=1)).isoformat(), "event_type": 'create', "pid": 2190, "ppid": 1042, "process_name": 'cmd.exe', "cpu_usage": 2.1, "memory_usage": 12000 },
        { "timestamp": (now - datetime.timedelta(seconds=2)).isoformat(), "event_type": 'create', "pid": 3104, "ppid": 2190, "process_name": 'powershell.exe', "cpu_usage": 28.4, "memory_usage": 98000 },
        { "timestamp": (now - datetime.timedelta(seconds=3)).isoformat(), "event_type": 'terminate', "pid": 2190, "ppid": 1042, "process_name": 'cmd.exe', "cpu_usage": 0.0, "memory_usage": 0 }
      ]
    }

@app.get("/api/v1/sessions/{session_id}/network")
async def session_network(session_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    now = datetime.datetime.utcnow()
    return {
      "items": [
        { "timestamp": now.isoformat(), "protocol": 'TCP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 49152, "destination_ip": '185.220.101.5', "destination_port": 443, "bytes_sent": 15420 },
        { "timestamp": (now - datetime.timedelta(seconds=5)).isoformat(), "protocol": 'UDP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 53, "destination_ip": '8.8.8.8', "destination_port": 53, "bytes_sent": 512 },
        { "timestamp": (now - datetime.timedelta(seconds=10)).isoformat(), "protocol": 'TCP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 49155, "destination_ip": '104.21.32.8', "destination_port": 80, "bytes_sent": 2480 }
      ]
    }

# --- NEW FEATURES ---

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    action = Column(String)
    username = Column(String)
    details = Column(String)

Base.metadata.create_all(bind=engine)

@app.get("/api/v1/audit-logs")
async def get_audit_logs(limit: int = 50, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return {"items": [{"id": l.id, "timestamp": l.timestamp.isoformat(), "action": l.action, "username": l.username, "details": l.details} for l in logs]}

@app.post("/api/v1/sandboxes/{sandbox_id}/reset")
async def reset_sandbox(sandbox_id: str, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    sb = db.query(Sandbox).filter(Sandbox.id == sandbox_id).first()
    if not sb:
        raise HTTPException(status_code=404, detail="Sandbox not found")
        
    sb.status = "stopped"
    db.commit()
    
    # Audit log
    db.add(AuditLog(action="reset_sandbox", username=user["username"], details=f"Reset sandbox {sandbox_id}"))
    db.commit()
    return {"success": True, "status": "stopped"}

@app.get("/api/v1/sessions")
async def list_sessions(status: str = None, limit: int = 100, db: Session = Depends(get_db), user: dict = Depends(get_current_user)):
    query = db.query(AnalysisSession).order_by(AnalysisSession.created_at.desc())
    if status:
        query = query.filter(AnalysisSession.status == status)
    sessions = query.limit(limit).all()
    
    return {"items": [
        {"id": s.id, "sample_name": s.sample_name, "status": s.status, "created_at": s.created_at.isoformat()}
        for s in sessions
    ]}

@app.get("/api/v1/monitoring/status")
async def monitoring_status():
    return {
        "collectors_active": 2,
        "pipeline_status": "healthy",
        "last_event_received": datetime.datetime.utcnow().isoformat(),
        "events_processed_1h": 450,
        "dropped_events": 0
    }
