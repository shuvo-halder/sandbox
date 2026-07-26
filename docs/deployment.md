# MBS Deployment Guide

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2+
- 4GB+ RAM available for Docker
- Git

## Quick Start (Development)

```bash
# 1. Clone the repository
git clone <repository-url>
cd malware-behavior-sandbox

# 2. Copy environment file
cp .env.example .env

# 3. Start development services (PostgreSQL + Redis)
make setup-dev

# 4. Install backend dependencies
cd backend && pip install -r requirements.txt

# 5. Run database migrations
cd backend && alembic upgrade head

# 6. Start the backend
cd backend && python -m uvicorn api.main:app --reload --port 8000

# 7. Start the frontend (new terminal)
cd frontend && npm install && npm start
```

## Production Deployment

### Docker Compose (Recommended)

```bash
# Build and start all services
cp .env.example .env  # Edit with production values!
make up-build

# Verify health
make health

# View logs
make logs
```

### Services

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 80, 443 | Reverse proxy |
| Frontend | 3000 | React dashboard |
| Backend | 8000 | FastAPI server |
| Monitor | 9090 | Go monitoring service |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |

## Environment Variables

See `.env.example` for all configurable variables. Key settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_PASSWORD` | PostgreSQL password | Required |
| `JWT_SECRET_KEY` | JWT signing key | Required |
| `REDIS_PASSWORD` | Redis password | Required |
| `SANDBOX_IMAGE` | Sandbox Docker image | mbs-sandbox:latest |

## Database Setup

```bash
# Run migrations
make db-migrate

# Seed demo data
make seed

# Reset database
make db-reset
```

## Monitoring

- Health check: `GET /api/v1/health`
- API docs: `http://localhost:8000/api/docs`
- Frontend: `http://localhost:3000`

## Backup

```bash
# Database backup
docker-compose exec postgres pg_dump -U mbs_user mbs_db > backup.sql

# Restore
docker-compose exec -T postgres psql -U mbs_user mbs_db < backup.sql