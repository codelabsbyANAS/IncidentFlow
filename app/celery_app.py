import os

from celery import Celery
from dotenv import load_dotenv


load_dotenv()

CELERY_BROKER_URL = os.getenv(
    "CELERY_BROKER_URL",
    "redis://localhost:6379/0"
)

CELERY_RESULT_BACKEND = os.getenv(
    "CELERY_RESULT_BACKEND",
    "redis://localhost:6379/1"
)


celery_app = Celery(
    "incidentflow",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
    include=["app.tasks"]
)

celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=True,

    beat_schedule={
        "check-sla-breaches-every-5-minutes": {
            "task": "incidentflow.check_sla_breaches",
            "schedule": 300.0,
        }
    }
)