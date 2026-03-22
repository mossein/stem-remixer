import librosa


def detect_bpm(filepath: str) -> tuple[float, float]:
    """Detect BPM and duration of an audio file.
    Returns (bpm, duration_seconds).
    """
    y, sr = librosa.load(filepath, sr=22050, mono=True, duration=60)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    bpm = float(tempo[0]) if hasattr(tempo, "__len__") else float(tempo)

    # Get full duration
    duration = librosa.get_duration(path=filepath)
    return bpm, duration
