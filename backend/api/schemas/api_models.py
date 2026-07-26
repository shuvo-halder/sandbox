from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, Any, Dict

class SandboxResponse(BaseModel):
    id: str
    name: str
    status: str
    os_image: str
    cpu_limit: int
    memory_limit: int
    network_mode: str

class SandboxListResponse(BaseModel):
    items: List[SandboxResponse]

class SessionResponse(BaseModel):
    id: str
    sample_name: str
    status: str
    created_at: datetime

class SessionListResponse(BaseModel):
    items: List[SessionResponse]

class EventResponse(BaseModel):
    id: int
    type: str
    title: str
    description: str
    severity: str
    timestamp: datetime

class EventListResponse(BaseModel):
    items: List[EventResponse]

class RiskResponse(BaseModel):
    score: int
    classification: str

class Finding(BaseModel):
    severity: str
    category: str
    title: str
    description: str

class SummaryResponse(BaseModel):
    total_file_events: int
    suspicious_files: int
    total_process_events: int
    total_network_events: int
    suspicious_network: int
    findings: List[Finding]
    summary: str

class ReportResponse(BaseModel):
    id: str
    session_id: str
    format: str
    file_size: int
    created_at: datetime

class ReportListResponse(BaseModel):
    items: List[ReportResponse]

class ReportCreateRequest(BaseModel):
    session_id: str
    format: str

class UserResponse(BaseModel):
    id: str
    username: str
    role: str

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    action: str
    username: str
    details: str

class AuditLogListResponse(BaseModel):
    items: List[AuditLogResponse]

class ProcessItem(BaseModel):
    timestamp: datetime
    event_type: str
    pid: int
    ppid: int
    process_name: str
    cpu_usage: float
    memory_usage: int

class ProcessListResponse(BaseModel):
    items: List[ProcessItem]

class NetworkItem(BaseModel):
    timestamp: datetime
    protocol: str
    direction: str
    source_ip: str
    source_port: int
    destination_ip: str
    destination_port: int
    bytes_sent: int

class NetworkListResponse(BaseModel):
    items: List[NetworkItem]

class RecentActivity(BaseModel):
    type: str
    title: str
    description: str
    status: str
    created_at: datetime

class RecentActivityList(BaseModel):
    items: List[RecentActivity]

class DashboardStats(BaseModel):
    total_sandboxes: int
    active_sandboxes: int
    total_sessions: int
    avg_risk_score: int
    malicious_count: int
    suspicious_count: int
    benign_count: int
    total_reports: int
