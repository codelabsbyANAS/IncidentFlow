from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_incidents: int
    open_incidents: int
    assigned_incidents: int
    in_progress_incidents: int
    resolved_incidents: int
    closed_incidents: int
    critical_incidents: int
    active_escalations: int