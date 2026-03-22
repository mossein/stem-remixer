import { useMixerStore } from "../store/mixerStore";
import { transport } from "../audio/transport";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
}

export function TransportBar() {
  const {
    isPlaying,
    currentTime,
    duration,
    tempo,
    originalBpm,
    loopEnabled,
    loopStart,
    loopEnd,
    setTempo,
    setLoopEnabled,
  } = useMixerStore();

  const handlePlay = () => {
    if (isPlaying) transport.pause();
    else transport.play();
  };

  const handleStop = () => transport.stop();

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    transport.seek(Number(e.target.value));
  };

  const handleTempoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTempo = Number(e.target.value);
    setTempo(newTempo);
    transport.setTempo(newTempo / originalBpm);
  };

  const handleLoopToggle = () => {
    const newEnabled = !loopEnabled;
    setLoopEnabled(newEnabled);
    transport.setLoop(newEnabled, loopStart, loopEnd);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="transport-bar">
      {/* Left: Transport buttons */}
      <div className="transport-section transport-btns">
        <button className="tbtn" onClick={handleStop} title="Stop">
          <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="currentColor"/></svg>
        </button>
        <button className={`tbtn tbtn-play ${isPlaying ? "playing" : ""}`} onClick={handlePlay} title={isPlaying ? "Pause" : "Play"}>
          {isPlaying ? (
            <svg width="12" height="14" viewBox="0 0 12 14"><rect x="1" y="1" width="3.5" height="12" fill="currentColor"/><rect x="7.5" y="1" width="3.5" height="12" fill="currentColor"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 14 14"><polygon points="2,0 14,7 2,14" fill="currentColor"/></svg>
          )}
        </button>
        <button className={`tbtn tbtn-loop ${loopEnabled ? "active" : ""}`} onClick={handleLoopToggle} title="Loop">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
        </button>
      </div>

      {/* Center: Time display */}
      <div className="transport-section transport-display">
        <div className="time-lcd">
          <span className="time-main">{formatTime(currentTime)}</span>
          <span className="time-sep">/</span>
          <span className="time-total">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Seek bar */}
      <div className="transport-section transport-seek">
        <div className="seek-track">
          <div className="seek-fill" style={{ width: `${progress}%` }} />
          <input
            type="range"
            className="seek-input"
            min={0}
            max={duration || 1}
            step={0.01}
            value={currentTime}
            onChange={handleSeek}
          />
        </div>
      </div>

      {/* Right: Tempo + Loop info */}
      <div className="transport-section transport-meta">
        <div className="tempo-control">
          <span className="meta-label">BPM</span>
          <input
            type="number"
            className="tempo-input"
            min={Math.round(originalBpm * 0.5)}
            max={Math.round(originalBpm * 1.5)}
            value={Math.round(tempo)}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v > 0) {
                setTempo(v);
                transport.setTempo(v / originalBpm);
              }
            }}
          />
          <input
            type="range"
            className="tempo-slider"
            min={Math.round(originalBpm * 0.5)}
            max={Math.round(originalBpm * 1.5)}
            step={1}
            value={tempo}
            onChange={handleTempoChange}
          />
        </div>
        {loopEnabled && (
          <div className="loop-info">
            <span className="meta-label">LOOP</span>
            <span className="loop-times">{formatTime(loopStart)} - {formatTime(loopEnd)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
