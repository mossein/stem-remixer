import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, HTTPException, UploadFile

from ..config import MAX_UPLOAD_SIZE, STORAGE_DIR
from ..models.schemas import UploadResponse
from ..services.separator import process_session, write_session_json

router = APIRouter()


@router.post("/api/upload", response_model=UploadResponse)
async def upload_mp3(file: UploadFile, background_tasks: BackgroundTasks):
    if not file.filename or not file.filename.lower().endswith(".mp3"):
        raise HTTPException(400, "Only MP3 files are accepted")

    content = await file.read()
    if len(content) > MAX_UPLOAD_SIZE:
        raise HTTPException(413, "File too large (max 50MB)")

    session_id = str(uuid.uuid4())
    session_dir = STORAGE_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)

    original_path = session_dir / "original.mp3"
    original_path.write_bytes(content)

    write_session_json(session_dir, {
        "id": session_id,
        "filename": file.filename,
        "stems": [],
        "status": "processing",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    background_tasks.add_task(process_session, session_id, session_dir, file.filename)

    return UploadResponse(session_id=session_id, status="processing")
