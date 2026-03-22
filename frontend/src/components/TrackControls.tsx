import { useMixerStore } from "../store/mixerStore";
import { AudioTrack } from "../audio/track";
import { STEM_COLORS } from "../types";

interface TrackControlsProps {
  stemName: string;
  audioTrack: AudioTrack;
}

export function TrackControls({ stemName, audioTrack }: TrackControlsProps) {
  const track = useMixerStore((s) => s.tracks[stemName]);
  const { setVolume, setPan, toggleMute, toggleSolo } = useMixerStore();

  if (!track) return null;

  const color = STEM_COLORS[stemName] || "#888";
  const volPercent = Math.round(track.volume * 100);
  const panLabel = track.pan === 0 ? "C" : track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : `R${Math.round(track.pan * 100)}`;

  return (
    <div className="track-controls">
      {/* Track name with color indicator */}
      <div className="tc-header">
        <div className="tc-color-dot" style={{ background: color }} />
        <span className="tc-name">{stemName}</span>
      </div>

      {/* Mute / Solo */}
      <div className="tc-buttons">
        <button
          className={`tc-btn ${track.muted ? "tc-mute-on" : ""}`}
          onClick={() => {
            toggleMute(stemName);
            audioTrack.setMuted(!track.muted);
          }}
        >
          M
        </button>
        <button
          className={`tc-btn ${track.soloed ? "tc-solo-on" : ""}`}
          onClick={() => toggleSolo(stemName)}
        >
          S
        </button>
      </div>

      {/* Volume fader */}
      <div className="tc-fader-group">
        <span className="tc-fader-label">VOL</span>
        <div className="tc-fader-wrap">
          <input
            type="range"
            className="tc-fader"
            min={0}
            max={1}
            step={0.005}
            value={track.volume}
            style={{ "--fader-color": color } as React.CSSProperties}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(stemName, v);
              audioTrack.setVolume(v);
            }}
          />
          <div className="tc-fader-fill" style={{ width: `${volPercent}%`, background: color }} />
        </div>
        <span className="tc-fader-value">{volPercent}</span>
      </div>

      {/* Pan knob */}
      <div className="tc-fader-group">
        <span className="tc-fader-label">PAN</span>
        <div className="tc-fader-wrap">
          <input
            type="range"
            className="tc-fader"
            min={-1}
            max={1}
            step={0.01}
            value={track.pan}
            onChange={(e) => {
              const v = Number(e.target.value);
              setPan(stemName, v);
              audioTrack.setPan(v);
            }}
          />
          <div
            className="tc-pan-fill"
            style={{
              left: `${50}%`,
              width: `${Math.abs(track.pan) * 50}%`,
              transform: track.pan < 0 ? "translateX(-100%)" : "none",
            }}
          />
          <div className="tc-pan-center" />
        </div>
        <span className="tc-fader-value">{panLabel}</span>
      </div>
    </div>
  );
}
