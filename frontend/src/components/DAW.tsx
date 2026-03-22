import { useEffect, useRef, useCallback, useState } from "react";
import { useSessionStore } from "../store/sessionStore";
import { useMixerStore } from "../store/mixerStore";
import { stemUrl } from "../api/client";
import { AudioTrack } from "../audio/track";
import { transport } from "../audio/transport";
import { TransportBar } from "./TransportBar";
import { Track } from "./Track";
import { MixerStrip } from "./MixerStrip";

export function DAW() {
  const session = useSessionStore((s) => s.session);
  const reset = useSessionStore((s) => s.reset);
  const initTracks = useMixerStore((s) => s.initTracks);
  const tracks = useMixerStore((s) => s.tracks);
  const audioTracksRef = useRef<Map<string, AudioTrack>>(new Map());
  const [view, setView] = useState<"arrange" | "mixer">("arrange");

  useEffect(() => {
    if (!session) return;
    initTracks(session.stems, session.bpm || 120, session.duration || 0);

    const audioTracks = new Map<string, AudioTrack>();
    session.stems.forEach((stem) => {
      const at = new AudioTrack(stem, stemUrl(session.id, stem));
      audioTracks.set(stem, at);
    });
    audioTracksRef.current = audioTracks;
    transport.setTracks(Array.from(audioTracks.values()));

    return () => { transport.dispose(); audioTracks.forEach((t) => t.dispose()); };
  }, [session, initTracks]);

  // Solo logic
  useEffect(() => {
    const anySoloed = Object.values(tracks).some((t) => t.soloed);
    audioTracksRef.current.forEach((at, stem) => {
      const t = tracks[stem];
      if (!t) return;
      at.setMuted(anySoloed ? !t.soloed : t.muted);
    });
  }, [tracks]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target !== document.body) return;
    if (e.code === "Space") { e.preventDefault(); transport.isPlaying ? transport.pause() : transport.play(); }
    if (e.code === "Home") { e.preventDefault(); transport.stop(); }
    if (e.key === "1") setView("arrange");
    if (e.key === "2") setView("mixer");
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!session) return null;

  return (
    <div className="daw">
      {/* ===== TOOLBAR ===== */}
      <div className="daw-toolbar">
        <div className="toolbar-left">
          <div className="toolbar-logo">
            <span className="logo-text">STEM</span>
            <span className="logo-sub">REMIXER</span>
          </div>
          <div className="toolbar-divider" />
          <div className="toolbar-project">
            <span className="project-name">{session.filename}</span>
          </div>
        </div>

        <div className="toolbar-center">
          <div className="toolbar-tabs">
            <button className={`tab-btn ${view === "arrange" ? "active" : ""}`} onClick={() => setView("arrange")}>
              <span className="tab-key">1</span> Arrangement
            </button>
            <button className={`tab-btn ${view === "mixer" ? "active" : ""}`} onClick={() => setView("mixer")}>
              <span className="tab-key">2</span> Mixer
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="toolbar-info">
            <div className="info-chip"><span className="info-label">BPM</span><span className="info-val">{Math.round(session.bpm || 0)}</span></div>
            <div className="info-chip"><span className="info-label">KEY</span><span className="info-val">--</span></div>
            <div className="info-chip"><span className="info-label">SR</span><span className="info-val">44.1k</span></div>
          </div>
          <button className="toolbar-new-btn" onClick={reset}>New</button>
        </div>
      </div>

      {/* ===== TRANSPORT ===== */}
      <TransportBar />

      {/* ===== MAIN CONTENT ===== */}
      <div className="daw-content">
        {view === "arrange" ? (
          <div className="arrange-view">
            {/* Timeline ruler */}
            <div className="arr-ruler-row">
              <div className="arr-ruler-spacer" />
              <div
                className="arr-ruler"
                style={{ cursor: "crosshair" }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = (e.clientX - rect.left) / rect.width;
                  const dur = session.duration || 0;
                  transport.seek(ratio * dur);
                }}
              >
                <TimelineRuler duration={session.duration || 0} />
              </div>
            </div>

            {/* Tracks */}
            <div className="arr-tracks-scroll">
              {session.stems.map((stem, i) => {
                const at = audioTracksRef.current.get(stem);
                if (!at) return null;
                return (
                  <Track
                    key={stem}
                    stemName={stem}
                    url={stemUrl(session.id, stem)}
                    audioTrack={at}
                    isFirst={i === 0}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mixer-view">
            <div className="mixer-strips">
              {session.stems.map((stem) => {
                const at = audioTracksRef.current.get(stem);
                if (!at) return null;
                return <MixerStrip key={stem} stemName={stem} audioTrack={at} />;
              })}
              {/* Master strip */}
              <div className="mixer-strip master-strip">
                <div className="strip-header">
                  <div className="strip-color-bar" style={{ background: "#fff" }} />
                  <span className="strip-name">MASTER</span>
                </div>
                <div className="strip-fader-section">
                  <div className="fader-meter-wrap">
                    <div className="strip-meter">
                      <div className="meter-fill" style={{ height: "80%", background: "linear-gradient(to top, #7c6aff, #a78bfa 70%, #ffaa00 85%, #ff3333)" }} />
                    </div>
                    <div className="vertical-fader-wrap">
                      <input type="range" className="vertical-fader" min={0} max={1} step={0.005} defaultValue={0.8} orient="vertical" />
                    </div>
                  </div>
                  <span className="strip-db">0.0 dB</span>
                </div>
                <div className="strip-buttons">
                  <div className="master-label">OUT</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== STATUS BAR ===== */}
      <div className="daw-statusbar">
        <div className="status-left">
          <div className="status-indicator" />
          <span>Engine Active</span>
          <span className="status-sep" />
          <span>{session.stems.length} stems loaded</span>
        </div>
        <div className="status-right">
          <span>Web Audio API</span>
          <span className="status-sep" />
          <span>Demucs htdemucs</span>
          <span className="status-sep" />
          <kbd className="status-kbd">Space</kbd> Play
          <kbd className="status-kbd">1</kbd>/<kbd className="status-kbd">2</kbd> View
        </div>
      </div>
    </div>
  );
}

function TimelineRuler({ duration }: { duration: number }) {
  if (duration <= 0) return null;
  const interval = duration <= 30 ? 2 : duration <= 60 ? 5 : 10;
  const marks: { pos: number; label: string; major: boolean }[] = [];

  for (let t = 0; t <= duration; t += interval) {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    marks.push({
      pos: (t / duration) * 100,
      label: `${m}:${s.toString().padStart(2, "0")}`,
      major: t % (interval * 2) === 0,
    });
  }

  // Also add bar numbers
  const barsPerMin = 4; // approximate
  return (
    <div className="ruler-container">
      {marks.map((mark, i) => (
        <div key={i} className={`ruler-mark ${mark.major ? "major" : "minor"}`} style={{ left: `${mark.pos}%` }}>
          <div className="ruler-tick" />
          {mark.major && <span className="ruler-label">{mark.label}</span>}
        </div>
      ))}
    </div>
  );
}
