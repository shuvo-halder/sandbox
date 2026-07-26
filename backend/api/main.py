import os
import sys
from typing import List
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, status
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/api/v1/health")
async def health_check():
    return {"status": "ok", "service": "MBS FastAPI Engine"}

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
