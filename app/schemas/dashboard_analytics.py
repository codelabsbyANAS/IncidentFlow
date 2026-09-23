from pydantic import BaseModel


class AnalyticsBreakdownItem(BaseModel):
    label: str
    count: int


class AgentWorkloadItem(BaseModel):
    user_id: int
    name: str
    role: str
    active_incidents: int


class DailyIncidentItem(BaseModel):
    date: str
    count: int


class DashboardAnalyticsResponse(BaseModel):
    total_incidents: int
    active_incidents: int

    sla_compliance_percentage: float
    breached_incidents: int

    average_resolution_minutes: float | None

    incidents_by_status: list[AnalyticsBreakdownItem]
    incidents_by_priority: list[AnalyticsBreakdownItem]
    incidents_by_category: list[AnalyticsBreakdownItem]

    agent_workload: list[AgentWorkloadItem]

    daily_incidents: list[DailyIncidentItem]