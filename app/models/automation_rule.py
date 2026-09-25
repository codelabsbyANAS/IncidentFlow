from datetime import datetime, timezone

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)

from app.database import Base


class AutomationRule(Base):
    __tablename__ = "automation_rules"

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

    name = Column(
        String(150),
        nullable=False
    )

    priority = Column(
        String(20),
        nullable=True
    )

    category = Column(
        String(100),
        nullable=True
    )

    assign_to_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )