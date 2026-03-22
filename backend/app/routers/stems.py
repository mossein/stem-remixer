from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from ..config import STEMS, STORAGE_DIR

router = APIRouter()


@router.get("/api/sessions/{session_id}/stems/{stem}")
async def get_stem(session_id: str, stem: str):
    if stem not in STEMS:
        raise HTTPException(400, f"Invalid stem. Must be one of: {STEMS}")

    stem_path = STORAGE_DIR / session_id / f"{stem}.wav"
    if not stem_path.exists():
        raise HTTPException(404, "Stem not found")

    return FileResponse(
        stem_path,
        media_type="audio/wav",
        filename=f"{stem}.wav",
    )
