from fastapi import FastAPI

from app.routers.admin import router as admin_router
from app.routers.auth import router as auth_router
from app.routers.comments import router as comments_router
from app.routers.dashboard import router as dashboard_router
from app.routers.history import router as history_router
from app.routers.incidents import router as incidents_router
from app.routers.notifications import router as notifications_router
from app.routers.organizations import router as organizations_router
from app.routers.sla import router as sla_router
from app.routers.users import router as users_router


app = FastAPI(
    title="IncidentFlow API",
    description="Multi-Tenant Incident and SLA Management Platform",
    version="1.0.0"
)


# Register application routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(admin_router)
app.include_router(incidents_router)
app.include_router(comments_router)
app.include_router(history_router)
app.include_router(sla_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)
app.include_router(organizations_router)


@app.get("/")
def home():
    return {
        "message": "IncidentFlow API is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }