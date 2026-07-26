from pydantic import BaseModel, Field
from datetime import datetime
from typing import Literal

class TelemetryEvent(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    type: Literal["process", "network", "file", "alert"]
    session_id: str
    title: str
    description: str
    severity: Literal["low", "medium", "high", "critical"]
