# 🛡️ Malware Behavior Sandbox (MBS)

**Secure isolated malware behavior analysis platform for cybersecurity research and defensive analysis.**

> **Purpose:** This platform safely executes suspicious programs inside controlled environments and monitors their behavior for malware detection, behavioral analysis, digital forensics, and security research.

> **Disclaimer:** This project is strictly for defensive security research. It does NOT generate malware, persistence mechanisms, exploit code, or offensive functionality.

---

## 📋 Features

| Feature | Description | Technology |
|---------|-------------|------------|
| **Sandbox Management** | Create, start, stop, reset isolated environments | Docker, cgroups |
| **File Monitoring** | Track file creation, deletion, modification, permissions | inotifywait, Go |
| **Process Monitoring** | Monitor process creation, termination, resource usage | /proc, Go |
| **Network Monitoring** | Track TCP/UDP/DNS connections and traffic | /proc/net, Go |
| **Behavioral Analysis** | Rule-based risk scoring and classification | Python, scikit-learn |
| **Report Generation** | JSON, PDF, HTML analysis reports | reportlab, Jinja2 |
| **Web Dashboard** | Real-time monitoring, charts, filtering | React, Recharts |
| **REST API** | Full CRUD with JWT auth and RBAC | FastAPI |
| **WebSocket** | Real-time event streaming to dashboard | FastAPI WS |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│          Dashboard | Sandbox | Analytics             │
└────────────────────┬────────────────────────────────┘
                     │ HTTP / WebSocket
┌────────────────────┴────────────────────────────────┐
│              Nginx Reverse Proxy                     │
└──────┬─────────────────────────────┬────────────────┘
       │                             │
┌──────┴──────────┐    ┌─────────────┴───────────────┐
│  FastAPI Backend│    │    Go Monitoring Service     │
│  JWT Auth       │    │    Process/File/Net Collect  │
│  RBAC           │    │    Goroutine Pipeline        │
│  Rate Limiting  │    └─────────────┬───────────────┘
└──────┬──────────┘                  │
       │                    ┌────────┴────────┐
┌──────┴──────┐    ┌────────┴────────┐       │
│ PostgreSQL  │    │ Docker Sandbox   │       │
│ Redis Cache │    │ (Ubuntu 22.04)   │       │
└─────────────┘    │ Isolated Network │       │
                   │ Resource Limits  │       │
                   └──────────────────┘       │
```

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2+
- 4GB+ RAM available

### Development Setup

```bash
# Clone and configure
git clone <repo-url>
cd malware-behavior-sandbox
cp .env.example .env

# Start development database services
make setup-dev

# Start backend (terminal 1)
cd backend
pip install -r requirements.txt
python -m uvicorn api.main:app --reload --port 8000

# Start frontend (terminal 2)
cd frontend
npm install
npm start
```

### Production Deployment

```bash
# Build and launch all services
cp .env.example .env  # Edit with production secrets!
make up-build

# Check health
make health

# Access
# Dashboard: http://localhost:3000
# API Docs:  http://localhost:8000/api/docs
```

### Default Credentials
| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | admin |
| analyst | analyst123 | analyst |

---

## 📁 Project Structure

```
malware-behavior-sandbox/
├── backend/                    # Python/FastAPI backend
│   ├── api/                    # FastAPI application
│   │   ├── main.py             # App entry point
│   │   ├── config.py           # Settings from env vars
│   │   ├── middleware/          # Auth, audit, CORS
│   │   ├── routes/             # API endpoints (8 routers)
│   │   ├── schemas/            # Pydantic validation
│   │   ├── database/           # SQLAlchemy models + session
│   │   └── websocket/          # Real-time handlers
│   ├── analysis/               # Behavioral analysis engine
│   │   ├── engine.py           # Orchestrator
│   │   ├── scoring.py          # Risk score calculator
│   │   └── classifier.py       # Behavior classification
│   └── requirements.txt
├── monitoring/                 # Go monitoring service
│   ├── cmd/monitor/main.go     # Entry point
│   ├── internal/
│   │   ├── collector/          # Process, file, network
│   │   ├── reporter/           # API client
│   │   ├── pipeline/           # Goroutine orchestrator
│   │   └── models/             # Event data structures
│   └── go.mod
├── frontend/                   # React dashboard
│   ├── src/
│   │   ├── pages/              # 6 pages (Dashboard, Sandbox, etc.)
│   │   ├── components/         # Layout, charts, tables
│   │   ├── context/            # Auth context
│   │   └── api/                # Axios client
│   └── package.json
├── docker/                     # Docker configuration
│   ├── Dockerfile.sandbox      # Isolated execution env
│   ├── sandbox-entrypoint.sh   # Container lifecycle
│   └── collect-events.sh       # In-container collector
├── configs/                    # Nginx, Redis, collector config
├── database/migrations/        # SQL schema
├── tests/                      # Unit + integration tests
├── scripts/                    # DB seeder, utilities
├── docs/                       # Architecture, deployment, security
├── docker-compose.yml          # Production orchestration
├── docker-compose.dev.yml      # Development services
├── Makefile                    # 30+ commands
└── .env.example                # Environment template
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register user |
| POST | `/api/v1/auth/login` | Login (returns JWT) |
| POST | `/api/v1/auth/refresh` | Refresh token |
| GET | `/api/v1/auth/me` | Get profile |

### Sandboxes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sandboxes` | List sandboxes |
| POST | `/api/v1/sandboxes` | Create sandbox |
| POST | `/api/v1/sandboxes/{id}/start` | Start sandbox |
| POST | `/api/v1/sandboxes/{id}/stop` | Stop sandbox |
| POST | `/api/v1/sandboxes/{id}/reset` | Reset sandbox |
| POST | `/api/v1/sandboxes/{id}/snapshot` | Take snapshot |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/analytics/sessions` | Create session |
| GET | `/api/v1/analytics/sessions` | List sessions |
| GET | `/api/v1/analytics/risk/{id}` | Risk score |
| GET | `/api/v1/analytics/summary/{id}` | Analysis summary |
| GET | `/api/v1/analytics/timeline/{id}` | Event timeline |

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/sessions/{id}/files` | File events |
| GET | `/api/v1/sessions/{id}/processes` | Process events |
| GET | `/api/v1/sessions/{id}/network` | Network events |

### Reports & Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/reports/generate` | Generate report |
| GET | `/api/v1/reports` | List reports |
| GET | `/api/v1/reports/{id}/download` | Download report |
| GET | `/api/v1/dashboard` | Dashboard overview |

Full interactive docs: `http://localhost:8000/api/docs`

---

## 📊 Analysis Engine

### Risk Scoring (0-100)
- **0-25:** Benign
- **26-65:** Suspicious
- **66-100:** Malicious

### Detection Rules
| Category | Rule | Severity |
|----------|------|----------|
| File | Excessive modifications (>50) | Medium/High |
| File | System directory changes | High |
| File | Permission changes | High |
| Process | Excessive child processes (>30) | High |
| Process | Suspicious process names | Medium |
| Network | Excessive outbound connections (>10 IPs) | High |
| Network | DNS tunneling indicators | High |
| Network | Large data exfiltration (>10MB) | High |
| Resource | High CPU usage (>80%) | Medium |
| Resource | High memory usage (>500MB) | Medium |

---

## 🧪 Testing

```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Run Go tests
make test-monitor
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design and components |
| [Deployment](docs/deployment.md) | Setup and deployment guide |
| [Security](docs/security.md) | Security measures and policies |

---

## 🛠️ Make Commands

```bash
make help          # Show all commands
make setup         # Full project setup
make up-build      # Build and start all services
make down          # Stop all services
make logs          # View service logs
make test          # Run tests
make db-migrate    # Run database migrations
make seed          # Seed demo data
make health        # Check service health
make clean         # Clean build artifacts
```

---

## 📜 License

This project is for authorized security research and defensive analysis purposes only.