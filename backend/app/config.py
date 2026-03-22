from pathlib import Path

STORAGE_DIR = Path(__file__).parent / "storage"
ALLOWED_ORIGINS = ["http://localhost:5173"]
DEMUCS_MODEL = "htdemucs"
MAX_UPLOAD_SIZE = 50 * 1024 * 1024  # 50MB
STEMS = ["vocals", "drums", "bass", "other"]
