# MBS Architecture

## System Overview

The Malware Behavior Sandbox (MBS) is a multi-layered security analysis platform built with a microservices architecture.

## Components

### 1. Backend API (Python/FastAPI)
- REST API with JWT authentication
- Database management with SQLAlchemy async
- Report generation in JSON/PDF/HTML
- WebSocket support for real-time updates
- Rate limiting and audit logging

### 2. Analysis Engine (Python)
- Rule-based behavioral analysis
- Risk scoring (0-100)
- Behavior classification (benign/suspicious/malicious)
- Feature extraction from events
- ML-ready anomaly detection interface

### 3. Monitoring Service (Go)
- Goroutine-based concurrent collectors
- Process monitoring via /proc filesystem
- File system change detection
- Network connection monitoring via /proc/net
- Channel-based event pipeline

### 4. Sandbox Container (Docker)
- Isolated Ubuntu 22.04 containers
- Resource limits (CPU, memory, disk)
- Network isolation
- Event collection via inotifywait + process scanning
- Configurable execution timeout

### 5. Frontend (React)
- Dashboard with real-time statistics
- Sandbox management interface
- Process and network event viewers
- Analytics with risk scoring visualization
- Report generation and download

### 6. Database (PostgreSQL)
- Async operations with SQLAlchemy
- UUID primary keys
- JSONB for flexible data storage
- Proper indexing for performance

### 7. Cache (Redis)
- Session caching
- Rate limiting backing store

## Data Flow

```
Sample Upload → Sandbox Container → Event Collectors → Go Monitor → FastAPI → PostgreSQL
                                                                              ↓
Dashboard ← React Frontend ← REST API ← Analysis Engine ← Event Processing
```

## Security Architecture

- JWT-based authentication with refresh tokens
- Role-based access control (admin, analyst, viewer)
- API rate limiting
- Audit logging on all requests
- Input validation via Pydantic
- Non-root container execution
- Network isolation for sandboxes