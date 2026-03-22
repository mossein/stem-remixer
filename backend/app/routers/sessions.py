import shutil

from fastapi import APIRouter, HTTPException

from ..config import STORAGE_DIR
from ..models.schemas import SessionInfo
from ..services.separator import read_session_json

router = APIRouter()


@router.get("/api/sessions", response_model=list[SessionInfo])
async def list_sessions():
    sessions = []
    if not STORAGE_DIR.exists():
        return sessions

    for session_dir in sorted(STORAGE_DIR.iterdir(), reverse=True):
        if not session_dir.is_dir():
            continue
        data = read_session_json(session_dir)
        if data:
            sessions.append(SessionInfo(**data))
    return sessions


@router.get("/api/sessions/{session_id}", response_model=SessionInfo)
async def get_session(session_id: str):
    session_dir = STORAGE_DIR / session_id
    if not session_dir.exists():
        raise HTTPException(404, "Session not found")

    data = read_session_json(session_dir)
    if not data:
        raise HTTPException(404, "Session metadata not found")

    return SessionInfo(**data)


@router.delete("/api/sessions/{session_id}")
async def delete_session(session_id: str):
    session_dir = STORAGE_DIR / session_id
    if not session_dir.exists():
        raise HTTPException(404, "Session not found")

    shutil.rmtree(session_dir)
    return {"deleted": session_id}
