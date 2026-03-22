# Stem Remixer

A web-based DAW that splits any MP3 into stems (vocals, drums, bass, other) using AI and lets you remix the song in your browser.

## Features

### Stem Separation
- Upload any MP3 file
- AI-powered separation using Meta's Demucs model (htdemucs)
- Automatic BPM detection via librosa
- Outputs 4 stems: vocals, drums, bass, other

### DAW Interface
- **Arrangement view** - FL Studio-style track lanes with colored clip blocks and waveforms
- **Mixer view** - vertical faders, pan knobs, peak meters, master strip
- **Transport** - play/pause/stop, seek, LCD time display
- **Click-to-seek** - click anywhere on a waveform or the timeline ruler to jump to that position

### Mixing
- Per-track volume faders and stereo panning
- Mute (M) and Solo (S) on every track
- Real-time parameter changes via Web Audio API

### Effects
Each track has its own effects chain with:
- **Reverb** - convolution reverb with Room, Hall, and Plate presets
- **Delay** - feedback delay with adjustable time and feedback
- **EQ** - biquad filter (lowpass, highpass, bandpass, peaking) with frequency, Q, and gain
- **Distortion** - waveshaper with drive amount

All effects have dry/wet mix control and can be toggled on/off independently.

### Tempo and Looping
- Tempo slider (50%-150% of original BPM) with pitch preservation
- Editable BPM input
- Loop toggle with draggable loop region on the waveform
- Loop start/end displayed in transport bar

### Session Management
- Browse and load previous sessions
- Delete old sessions
- Sessions persist on the backend with all stem files

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Space | Play / Pause |
| Home | Stop (return to start) |
| 1 | Switch to Arrangement view |
| 2 | Switch to Mixer view |

## Tech Stack

### Backend
- Python 3.10+
- FastAPI + Uvicorn
- Demucs (Meta) for stem separation
- librosa for BPM detection
- Background task processing

### Frontend
- React 18 + TypeScript
- Vite
- Zustand for state management
- wavesurfer.js v7 for waveform rendering
- Raw Web Audio API for the audio engine (no Tone.js)
- CSS with FL Studio-inspired dark theme

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- ffmpeg (for audio loading)

### Backend Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The first time you upload a file, Demucs will download the htdemucs model (~80MB).

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

## How It Works

1. **Upload** - Drop an MP3 on the upload page
2. **Separate** - Backend runs Demucs to split the song into 4 stems and detects BPM
3. **Remix** - The DAW loads all stems. Mix levels, add effects, change tempo, set loops
4. **Switch views** - Press 1 for arrangement (waveform editing), 2 for mixer (faders and meters)

## Architecture

```
stem-remixer/
  backend/
    app/
      main.py            # FastAPI app with CORS
      config.py           # Settings (storage dir, model, origins)
      routers/
        upload.py         # POST /api/upload
        stems.py          # GET /api/sessions/{id}/stems/{stem}
        sessions.py       # GET/DELETE /api/sessions
      services/
        separator.py      # Demucs wrapper, background processing
        analysis.py       # BPM detection
      models/
        schemas.py        # Pydantic models
      storage/            # Runtime stem files (gitignored)
  frontend/
    src/
      audio/
        engine.ts         # AudioContext singleton
        track.ts          # Per-track audio graph with effects chain
        transport.ts      # Synchronized multi-track playback
        effects.ts        # Reverb, delay, EQ, distortion factories
      components/
        DAW.tsx           # Main DAW with arrangement + mixer views
        Track.tsx         # Arrangement track with clip block
        MixerStrip.tsx    # Mixer channel strip
        Waveform.tsx      # wavesurfer.js waveform
        EffectsPanel.tsx  # Per-track effects rack with knobs
        TransportBar.tsx  # Transport controls + tempo + loop
      store/
        sessionStore.ts   # Upload, polling, session management
        mixerStore.ts     # Track state, transport state, effects params
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload MP3, starts background stem separation |
| GET | `/api/sessions/{id}` | Poll session status (processing/ready/error) |
| GET | `/api/sessions/{id}/stems/{stem}` | Download a stem WAV file |
| GET | `/api/sessions` | List all sessions |
| DELETE | `/api/sessions/{id}` | Delete session and its files |
| GET | `/api/health` | Health check |

## License

MIT
