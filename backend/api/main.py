import os
import sys
from typing import List, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import datetime
import random
import uuid

# Adjust path for relative imports if run directly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.schemas.event import TelemetryEvent
from analysis.scoring import calculate_risk_score

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
            await connection.send_text(message)

manager = ConnectionManager()
session_events = {}

# MOCK DATA FOR DEMO PURPOSES (Would use SQLAlchemy normally)
sandboxes = [
    { "id": 'sb-1', "name": 'Win11-Sandbox-01', "status": 'running', "os_image": 'windows-11-22h2', "cpu_limit": 4, "memory_limit": 8192, "network_mode": 'isolated' },
    { "id": 'sb-2', "name": 'Win10-Sandbox-02', "status": 'stopped', "os_image": 'windows-10-21h2', "cpu_limit": 2, "memory_limit": 4096, "network_mode": 'host-only' },
    { "id": 'sb-3', "name": 'Ubuntu-Sandbox-01', "status": 'running', "os_image": 'ubuntu-22.04-lts', "cpu_limit": 2, "memory_limit": 4096, "network_mode": 'isolated' }
]

reports = [
    { "id": 'rep-001', "session_id": 'sess-101', "format": 'pdf', "file_size": 245000, "created_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=1)).isoformat() },
    { "id": 'rep-002', "session_id": 'sess-102', "format": 'json', "file_size": 89000, "created_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=2)).isoformat() }
]

sessions = [
    { "id": 'sess-101', "sample_name": 'Trojan.Win32.Agent.exe', "status": 'completed' },
    { "id": 'sess-102', "sample_name": 'Ransomware.WannaCry.sample', "status": 'completed' },
    { "id": 'sess-103', "sample_name": 'Stealer.Info.py', "status": 'running' }
]

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "MBS FastAPI Engine"}

class AuthRequest(BaseModel):
    username: str = None
    password: str = None

@app.post("/api/v1/auth/login")
async def login():
    return {"access_token": "mock-jwt-token-access", "refresh_token": "mock-jwt-token-refresh"}

@app.get("/api/v1/auth/me")
async def auth_me():
    return {"id": "usr-1", "username": "sec_analyst", "email": "analyst@mbs.io", "role": "Security Analyst"}

@app.get("/api/v1/dashboard/stats")
async def dashboard_stats():
    return {
        "total_sandboxes": len(sandboxes),
        "active_sandboxes": len([s for s in sandboxes if s["status"] == "running"]),
        "total_sessions": len(sessions),
        "avg_risk_score": 78,
        "malicious_count": 5,
        "suspicious_count": 4,
        "benign_count": 3,
        "total_reports": len(reports)
    }

@app.get("/api/v1/dashboard/recent")
async def dashboard_recent():
    return [
      { "type": 'Sandbox', "title": 'Win11-Sandbox-01 Started', "description": 'Execution environment ready for sample Trojan.Win32.Agent.exe', "status": 'running', "created_at": (datetime.datetime.utcnow() - datetime.timedelta(minutes=20)).isoformat() },
      { "type": 'Analysis', "title": 'Session sess-101 Completed', "description": 'Risk score calculated: 85 (Malicious)', "status": 'completed', "created_at": (datetime.datetime.utcnow() - datetime.timedelta(hours=1)).isoformat() },
      { "type": 'Network', "title": 'Suspicious Traffic Detected', "description": 'Outbound connection to 185.220.101.5:443 flagged', "status": 'warning', "created_at": (datetime.datetime.utcnow() - datetime.timedelta(minutes=90)).isoformat() }
    ]

@app.get("/api/v1/sandboxes")
async def get_sandboxes():
    return {"items": sandboxes}

@app.post("/api/v1/sandboxes/{sandbox_id}/start")
async def start_sandbox(sandbox_id: str):
    for sb in sandboxes:
        if sb["id"] == sandbox_id:
            sb["status"] = "running"
            return sb
    return {"success": True}

@app.post("/api/v1/sandboxes/{sandbox_id}/stop")
async def stop_sandbox(sandbox_id: str):
    for sb in sandboxes:
        if sb["id"] == sandbox_id:
            sb["status"] = "stopped"
            return sb
    return {"success": True}

@app.get("/api/v1/analytics/sessions")
async def analytics_sessions():
    return {"items": sessions}

@app.get("/api/v1/sessions/{session_id}/processes")
async def session_processes(session_id: str):
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
async def session_network(session_id: str):
    now = datetime.datetime.utcnow()
    return {
      "items": [
        { "timestamp": now.isoformat(), "protocol": 'TCP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 49152, "destination_ip": '185.220.101.5', "destination_port": 443, "bytes_sent": 15420 },
        { "timestamp": (now - datetime.timedelta(seconds=5)).isoformat(), "protocol": 'UDP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 53, "destination_ip": '8.8.8.8', "destination_port": 53, "bytes_sent": 512 },
        { "timestamp": (now - datetime.timedelta(seconds=10)).isoformat(), "protocol": 'TCP', "direction": 'outbound', "source_ip": '192.168.1.105', "source_port": 49155, "destination_ip": '104.21.32.8', "destination_port": 80, "bytes_sent": 2480 }
      ]
    }

@app.get("/api/v1/analytics/risk/{session_id}")
async def analytics_risk(session_id: str):
    return {"score": 85, "classification": "malicious"}

@app.get("/api/v1/analytics/summary/{session_id}")
async def analytics_summary(session_id: str):
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
async def get_reports():
    return {"items": reports}

class ReportRequest(BaseModel):
    session_id: str = "sess-101"
    format: str = "pdf"

@app.post("/api/v1/reports/generate")
async def generate_report(req: Request):
    body = await req.json()
    new_rep = {
        "id": f"rep-{random.randint(100, 999)}",
        "session_id": body.get("session_id", "sess-101"),
        "format": body.get("format", "pdf"),
        "file_size": random.randint(50000, 250000),
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    reports.insert(0, new_rep)
    return new_rep

@app.post("/api/v1/events", status_code=status.HTTP_201_CREATED)
async def ingest_event(event: TelemetryEvent):
    """
    Ingest telemetry event from Go Collector, evaluate risk, 
    and broadcast to React dashboard via WebSockets.
    """
    if event.session_id not in session_events:
        session_events[event.session_id] = []
    
    event_dict = event.model_dump()
    event_dict['timestamp'] = event_dict['timestamp'].isoformat()
    
    session_events[event.session_id].append(event_dict)
    
    # Recalculate deterministic risk score
    current_score = calculate_risk_score(session_events[event.session_id])
    
    # Broadcast to React frontend
    broadcast_data = event.model_dump_json()
    await manager.broadcast(broadcast_data)
    
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
