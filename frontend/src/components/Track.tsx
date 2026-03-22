import { useState, useCallback } from "react";
import { AudioTrack } from "../audio/track";
import { Waveform } from "./Waveform";
import { EffectsPanel } from "./EffectsPanel";
import { useMixerStore } from "../store/mixerStore";
import { transport } from "../audio/transport";
import { STEM_COLORS } from "../types";

interface TrackProps {
  stemName: string;
  url: string;
  audioTrack: AudioTrack;
  isFirst: boolean;
}

export function Track({ stemName, url, audioTrack, isFirst }: TrackProps) {
  const [showEffects, setShowEffects] = useState(false);
  const track = useMixerStore((s) => s.tracks[stemName]);
  const { setVolume, setPan, toggleMute, toggleSolo } = useMixerStore();
  const color = STEM_COLORS[stemName] || "#888";

  const duration = useMixerStore((s) => s.duration);

  const handleLaneClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const lane = e.currentTarget;
    const rect = lane.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const seekTime = ratio * duration;
    if (seekTime >= 0 && seekTime <= duration) {
      transport.seek(seekTime);
    }
  }, [duration]);

  if (!track) return null;

  return (
    <div className={`arr-track ${track.muted ? "arr-muted" : ""}`}>
      {/* Track header (left panel) */}
      <div className="arr-track-header">
        <div className="arr-track-color" style={{ background: color }} />
        <div className="arr-track-info">
          <span className="arr-track-name">{stemName}</span>
          <div className="arr-track-btns">
            <button
              className={`arr-btn arr-m ${track.muted ? "on" : ""}`}
              onClick={() => { toggleMute(stemName); audioTrack.setMuted(!track.muted); }}
            >M</button>
            <button
              className={`arr-btn arr-s ${track.soloed ? "on" : ""}`}
              onClick={() => toggleSolo(stemName)}
            >S</button>
          </div>
          <div className="arr-vol-mini">
            <input
              type="range" min={0} max={1} step={0.01}
              value={track.volume}
              className="arr-vol-slider"
              style={{ "--vol-color": color } as React.CSSProperties}
              onChange={(e) => { const v = Number(e.target.value); setVolume(stemName, v); audioTrack.setVolume(v); }}
            />
            <input
              type="range" min={-1} max={1} step={0.01}
              value={track.pan}
              className="arr-pan-slider"
              onChange={(e) => { const v = Number(e.target.value); setPan(stemName, v); audioTrack.setPan(v); }}
            />
          </div>
        </div>
      </div>

      {/* Waveform clip area - click to seek */}
      <div className="arr-track-lane" onClick={handleLaneClick} style={{ cursor: "crosshair" }}>
        <div className="arr-clip" style={{ "--clip-color": color } as React.CSSProperties}>
          <div className="arr-clip-header">
            <span>{stemName}</span>
          </div>
          <div className="arr-clip-body">
            <Waveform url={url} stemName={stemName} showLoop={isFirst} />
          </div>
        </div>
        <button
          className={`arr-fx-btn ${showEffects ? "open" : ""}`}
          onClick={(e) => { e.stopPropagation(); setShowEffects(!showEffects); }}
        >
          FX
        </button>
      </div>

      {showEffects && (
        <div className="arr-fx-row">
          <div className="arr-fx-spacer" />
          <div className="arr-fx-content">
            <EffectsPanel stemName={stemName} audioTrack={audioTrack} />
          </div>
        </div>
      )}
    </div>
  );
}
