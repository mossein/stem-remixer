import json
import logging
import traceback
from datetime import datetime, timezone
from pathlib import Path

import torch
from demucs.pretrained import get_model
from demucs.separate import load_track, apply_model, save_audio

from ..config import DEMUCS_MODEL, STEMS
from .analysis import detect_bpm

logger = logging.getLogger(__name__)

_model = None
_device = None


def get_demucs_model():
    global _model, _device
    if _model is None:
        _device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Loading Demucs model '{DEMUCS_MODEL}' on {_device}")
        _model = get_model(DEMUCS_MODEL)
        _model.to(_device)
        logger.info("Demucs model loaded")
    return _model, _device


def write_session_json(session_dir: Path, data: dict):
    with open(session_dir / "session.json", "w") as f:
        json.dump(data, f, default=str)


def read_session_json(session_dir: Path) -> dict | None:
    path = session_dir / "session.json"
    if not path.exists():
        return None
    with open(path) as f:
        return json.load(f)


def process_session(session_id: str, session_dir: Path, filename: str):
    """Run Demucs separation and BPM detection. Called as a background task."""
    try:
        original = session_dir / "original.mp3"
        model, device = get_demucs_model()

        logger.info(f"Separating {filename} (session {session_id})")

        # Load and separate
        wav = load_track(str(original), model.audio_channels, model.samplerate)
        ref = wav.mean(0)
        wav = (wav - ref.mean()) / ref.std()

        sources = apply_model(model, wav[None], device=device)[0]
        sources = sources * ref.std() + ref.mean()

        # Save each stem
        for i, stem_name in enumerate(model.sources):
            stem_path = session_dir / f"{stem_name}.wav"
            save_audio(sources[i], str(stem_path), samplerate=model.samplerate)

        logger.info(f"Stems saved for session {session_id}")

        bpm, duration = detect_bpm(str(original))
        logger.info(f"BPM: {bpm:.1f}, Duration: {duration:.1f}s")

        write_session_json(session_dir, {
            "id": session_id,
            "filename": filename,
            "bpm": bpm,
            "duration": duration,
            "stems": list(model.sources),
            "status": "ready",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    except Exception as e:
        logger.error(f"Separation failed for session {session_id}: {e}")
        logger.error(traceback.format_exc())
        write_session_json(session_dir, {
            "id": session_id,
            "filename": filename,
            "stems": [],
            "status": "error",
            "error": str(e),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
