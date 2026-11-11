from datetime import datetime

from pydantic import BaseModel, ConfigDict

from backend.models import DocumentStatus


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    course_id: int
    filename: str
    status: DocumentStatus
    error_message: str | None
    created_at: datetime
    updated_at: datetime
