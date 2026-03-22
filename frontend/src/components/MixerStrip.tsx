import { useMixerStore } from "../store/mixerStore";
import { AudioTrack } from "../audio/track";
import { STEM_COLORS } from "../types";

interface MixerStripProps {
  stemName: string;
  audioTrack: AudioTrack;
}

export function MixerStrip({ stemName, audioTrack }: MixerStripProps) {
  const track = useMixerStore((s) => s.tracks[stemName]);
  const { setVolume, setPan, toggleMute, toggleSolo } = useMixerStore();

  if (!track) return null;

  const color = STEM_COLORS[stemName] || "#888";
  const dbValue = track.volume > 0 ? (20 * Math.log10(track.volume)).toFixed(1) : "-inf";
  const panLabel = track.pan === 0 ? "C" : track.pan < 0 ? `L${Math.round(Math.abs(track.pan) * 100)}` : `R${Math.round(track.pan * 100)}`;

  return (
    <div className="mixer-strip" style={{ "--strip-color": color } as React.CSSProperties}>
      {/* Strip header */}
      <div className="strip-header">
        <div className="strip-color-bar" style={{ background: color }} />
        <span className="strip-name">{stemName}</span>
      </div>

      {/* Pan knob */}
      <div className="strip-pan">
        <span className="strip-label">PAN</span>
        <div className="pan-knob-wrap">
          <div className="pan-visual">
            <div
              className="pan-indicator"
              style={{ transform: `rotate(${track.pan * 135}deg)` }}
            />
          </div>
          <input
            type="range"
            className="pan-input"
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
        </div>
        <span className="strip-value">{panLabel}</span>
      </div>

      {/* Vertical fader + meter */}
      <div className="strip-fader-section">
        <div className="fader-meter-wrap">
          {/* Fake peak meter */}
          <div className="strip-meter">
            <div
              className="meter-fill"
              style={{
                height: `${track.volume * 100}%`,
                background: `linear-gradient(to top, ${color}, ${color}dd 70%, #ffaa00 85%, #ff3333)`,
              }}
            />
            {/* dB markings */}
            <div className="meter-marks">
              <span className="meter-mark" style={{ bottom: '100%' }}>0</span>
              <span className="meter-mark" style={{ bottom: '75%' }}>-6</span>
              <span className="meter-mark" style={{ bottom: '50%' }}>-12</span>
              <span className="meter-mark" style={{ bottom: '25%' }}>-24</span>
            </div>
          </div>

          {/* Vertical fader */}
          <div className="vertical-fader-wrap">
            <input
              type="range"
              className="vertical-fader"
              min={0}
              max={1}
              step={0.005}
              value={track.volume}
              orient="vertical"
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(stemName, v);
                audioTrack.setVolume(v);
              }}
            />
          </div>
        </div>

        <span className="strip-db">{dbValue} dB</span>
      </div>

      {/* Mute / Solo buttons */}
      <div className="strip-buttons">
        <button
          className={`strip-btn strip-mute ${track.muted ? "on" : ""}`}
          onClick={() => {
            toggleMute(stemName);
            audioTrack.setMuted(!track.muted);
          }}
        >
          M
        </button>
        <button
          className={`strip-btn strip-solo ${track.soloed ? "on" : ""}`}
          onClick={() => toggleSolo(stemName)}
        >
          S
        </button>
      </div>
    </div>
  );
}
