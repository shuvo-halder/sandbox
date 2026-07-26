# MBS Security Documentation

## Authentication

- JWT tokens with configurable expiry
- Access tokens (30min default) + Refresh tokens (7 days)
- Password hashing with bcrypt
- API key authentication for service-to-service

## Authorization (RBAC)

| Role | Permissions |
|------|------------|
| Admin | Full access, user management, sandbox deletion |
| Analyst | Create/start/stop sandboxes, view reports |
| Viewer | Read-only access to data |

## API Security

- Rate limiting (60 req/min default)
- Input validation via Pydantic on all endpoints
- CORS configuration
- Request ID tracking (X-Request-ID)
- Audit logging on all non-health endpoints

## Container Security

- Non-root user execution in all containers
- Resource limits (CPU, memory, disk)
- Network isolation for sandbox containers
- Read-only Docker socket for monitor
- No privileged containers

## Data Security

- No hardcoded credentials (environment variables)
- Secrets not logged
- Database connections use TLS in production
- Report files stored with restricted permissions

## Sandbox Isolation

- Docker network isolation (bridge network)
- CPU limits (default: 2 cores)
- Memory limits (default: 2GB)
- Execution timeout (default: 300s)
- Restricted ulimits
- No host filesystem access