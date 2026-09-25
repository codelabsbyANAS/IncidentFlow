# ResolveOps

ResolveOps is a multi-tenant Incident and SLA Management Platform built with FastAPI, PostgreSQL, Redis, Celery, and Docker.

It is designed as a backend system for organizations that need to manage support incidents, assign tickets to staff, track SLA deadlines, create escalations, maintain incident history, and send user notifications.

## Features

### Authentication and Security

- JWT-based authentication
- Secure password hashing
- Role-based access control
- Roles:
  - Customer
  - Agent
  - Manager
  - Admin
- Multi-tenant organization isolation
- Organization-level access protection
- Inactive users and organizations are blocked
- Secure organization signup flow
- Admin-only user creation

### Incident Management

- Create incidents
- Automatic ticket numbers such as `INC-000001`
- Incident priorities:
  - Low
  - Medium
  - High
  - Critical
- Incident lifecycle:

```text
OPEN
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
RESOLVED
  ↓
CLOSED
```

- Assign incidents to agents, managers, or admins
- Agent ownership validation
- Search incidents
- Filter by status and priority
- Pagination
- Tenant-isolated incident access

### Comments and Internal Notes

- Public incident comments
- Internal support notes
- Customers cannot create internal notes
- Customers cannot view internal notes
- First public staff response is automatically tracked

### Incident History

ResolveOps records important ticket events, including:

- Incident creation
- Assignment
- Status changes
- First support response

This provides an audit trail for each incident.

### SLA Management

Organizations can configure SLA policies for different priorities.

Example:

```text
Critical
Response: 30 minutes
Resolution: 2 hours

High
Response: 1 hour
Resolution: 8 hours
```

ResolveOps automatically calculates:

- Response deadlines
- Resolution deadlines
- Response SLA status
- Resolution SLA status

Possible SLA states include:

```text
pending
met
breached
not_configured
```

### SLA Escalations

ResolveOps automatically creates SLA escalation records when deadlines are breached.

Features include:

- Response SLA escalation
- Resolution SLA escalation
- Duplicate escalation prevention
- Automatic escalation closure when an incident is resolved
- Manager/admin notifications

### Notifications

Users receive in-app notifications for events such as:

- Incident assignments
- SLA breaches

Notifications support:

- User-specific privacy
- Read/unread state
- Read timestamps

### Dashboard

Staff users can access dashboard metrics including:

- Total incidents
- Open incidents
- Assigned incidents
- In-progress incidents
- Resolved incidents
- Closed incidents
- Critical incidents
- Active SLA escalations

### Background Processing

Celery and Redis are used for asynchronous and scheduled processing.

Celery Beat checks SLA deadlines periodically.

```text
Celery Beat
     ↓
Redis
     ↓
Celery Worker
     ↓
SLA evaluation
     ↓
PostgreSQL
```

The SLA background task currently runs every 5 minutes.

## Technology Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- Pydantic
- JWT Authentication
- Argon2 password hashing

### Database

- PostgreSQL
- Alembic migrations

### Background Processing

- Redis
- Celery
- Celery Beat

### Testing

- Pytest
- FastAPI TestClient
- SQLite in-memory test database

### DevOps

- Docker
- Docker Compose

## Project Architecture

```text
IncidentFlow/
│
├── app/
│   ├── routers/
│   │   ├── admin.py
│   │   ├── auth.py
│   │   ├── comments.py
│   │   ├── dashboard.py
│   │   ├── history.py
│   │   ├── incidents.py
│   │   ├── notifications.py
│   │   ├── organizations.py
│   │   ├── sla.py
│   │   └── users.py
│   │
│   ├── models/
│   ├── schemas/
│   ├── celery_app.py
│   ├── database.py
│   ├── dependencies.py
│   ├── history.py
│   ├── main.py
│   ├── notifications.py
│   ├── security.py
│   ├── sla.py
│   └── tasks.py
│
├── migrations/
├── tests/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── alembic.ini
├── .env.example
├── .dockerignore
├── .gitignore
└── README.md
```

## Automated Testing

The project includes automated tests covering major application behavior.

Current test coverage includes:

- Authentication
- Tenant signup
- Admin user creation
- Role-based access control
- Inactive organization security
- Multi-tenant incident isolation
- Incident lifecycle
- Notification privacy
- SLA escalation closure
- Organization security
- Internal comment privacy
- Dashboard RBAC
- API health/OpenAPI availability

Run the test suite with:

```bash
pytest
```

## Running with Docker

Docker Compose runs the complete backend infrastructure:

```text
FastAPI
PostgreSQL
Redis
Celery Worker
Celery Beat
```

### 1. Configure environment variables

Copy:

```text
.env.example
```

to:

```text
.env
```

and replace the placeholder secrets with your own values.

### 2. Start the application

```bash
docker compose up -d --build
```

### 3. Check containers

```bash
docker compose ps
```

### 4. Open Swagger API documentation

```text
http://127.0.0.1:8000/docs
```

### 5. Health check

```text
http://127.0.0.1:8000/health
```

Expected response:

```json
{
  "status": "healthy"
}
```

### 6. Stop the stack

```bash
docker compose down
```

PostgreSQL data is stored in a Docker volume and persists across normal container restarts.

## API Workflow Example

A typical workflow is:

```text
POST /auth/signup
        ↓
Create organization + first admin
        ↓
POST /users
        ↓
Create agent
        ↓
POST /incidents
        ↓
Create incident
        ↓
PATCH /incidents/{id}/assign
        ↓
Assign agent
        ↓
PATCH /incidents/{id}/status
        ↓
IN_PROGRESS
        ↓
RESOLVED
```

## API Documentation

Interactive Swagger documentation is automatically generated by FastAPI:

```text
http://127.0.0.1:8000/docs
```

## Security Notes

Sensitive values are stored using environment variables.

The real `.env` file is excluded from Git and should never be committed.

Use `.env.example` as the configuration template.

## Future Improvements

Possible future enhancements include:

- Email notification delivery
- Refresh tokens
- User invitation workflow
- Advanced dashboard analytics
- Redis caching
- File attachments
- Frontend dashboard
- Cloud deployment and CI/CD

## Author

**Anas Chougle**

Computer Science postgraduate building backend, data, and software engineering projects.