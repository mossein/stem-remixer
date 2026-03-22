from datetime import datetime
from pydantic import BaseModel


class UploadResponse(BaseModel):
    session_id: str
    status: str


class SessionInfo(BaseModel):
    id: str
    filename: str
    bpm: float | None = None
    duration: float | None = None
    stems: list[str] = []
    status: str  # "processing" | "ready" | "error"
    created_at: datetime
    error: str | None = None
