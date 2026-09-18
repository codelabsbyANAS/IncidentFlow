from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey
)
from sqlalchemy.sql import func

from app.database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    organization_id = Column(
        Integer,
        ForeignKey("organizations.id"),
        nullable=False,
        index=True
    )

    ticket_number = Column(
        String(30),
        unique=True,
        nullable=False,
        index=True
    )

    title = Column(
        String(200),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    priority = Column(
        String(20),
        nullable=False,
        default="medium"
    )

    status = Column(
        String(30),
        nullable=False,
        default="open"
    )

    category = Column(
        String(100),
        nullable=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    assigned_to = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )
    
    sla_policy_id = Column(
        Integer,
        ForeignKey("sla_policies.id"),
        nullable=True,
        index=True
)

    response_due_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    resolution_due_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    first_response_at = Column(
        DateTime(timezone=True),
        nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    resolved_at = Column(
        DateTime(timezone=True),
        nullable=True
    )