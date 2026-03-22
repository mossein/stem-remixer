import { useMixerStore } from "../store/mixerStore";
import { AudioTrack } from "../audio/track";

interface EffectsPanelProps {
  stemName: string;
  audioTrack: AudioTrack;
}

function Knob({
  value,
  min,
  max,
  step,
  label,
  onChange,
  format,
}: {
  value: number;
  min: number;
  max: number;
  step: number;
  label: string;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  const angle = -135 + (pct / 100) * 270;
  return (
    <div className="knob-group">
      <div className="knob-outer">
        <div className="knob-track-ring" />
        <div className="knob-fill-ring" style={{ "--knob-angle": `${angle}deg` } as React.CSSProperties} />
        <div className="knob-indicator" style={{ transform: `rotate(${angle}deg)` }}>
          <div className="knob-dot" />
        </div>
        <input
          type="range"
          className="knob-input"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </div>
      <span className="knob-label">{label}</span>
      <span className="knob-value">{format ? format(value) : Math.round(value)}</span>
    </div>
  );
}

export function EffectsPanel({ stemName, audioTrack }: EffectsPanelProps) {
  const track = useMixerStore((s) => s.tracks[stemName]);
  const setEffect = useMixerStore((s) => s.setEffect);

  if (!track) return null;

  const toggle = (name: string, on: boolean) => {
    if (on) audioTrack.disableEffect(name);
    else audioTrack.enableEffect(name);
    setEffect(stemName, name, { enabled: !on });
  };

  const update = (fx: string, param: string, value: number | string) => {
    setEffect(stemName, fx, { [param]: value });
    audioTrack.updateEffect(fx, { [param]: value });
  };

  return (
    <div className="fx-rack">
      {/* REVERB */}
      <div className={`fx-unit ${track.effects.reverb.enabled ? "fx-active" : ""}`}>
        <button className="fx-power" onClick={() => toggle("reverb", track.effects.reverb.enabled)}>
          <div className="fx-power-dot" />
        </button>
        <span className="fx-name">REVERB</span>
        <div className="fx-knobs">
          <Knob value={track.effects.reverb.wet} min={0} max={1} step={0.01} label="MIX" format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => update("reverb", "wet", v)} />
          <div className="fx-select-group">
            <span className="knob-label">TYPE</span>
            <select className="fx-select" value={track.effects.reverb.preset} onChange={(e) => update("reverb", "preset", e.target.value)}>
              <option value="room">Room</option>
              <option value="hall">Hall</option>
              <option value="plate">Plate</option>
            </select>
          </div>
        </div>
      </div>

      {/* DELAY */}
      <div className={`fx-unit ${track.effects.delay.enabled ? "fx-active" : ""}`}>
        <button className="fx-power" onClick={() => toggle("delay", track.effects.delay.enabled)}>
          <div className="fx-power-dot" />
        </button>
        <span className="fx-name">DELAY</span>
        <div className="fx-knobs">
          <Knob value={track.effects.delay.wet} min={0} max={1} step={0.01} label="MIX" format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => update("delay", "wet", v)} />
          <Knob value={track.effects.delay.time} min={0.05} max={1} step={0.01} label="TIME" format={(v) => `${Math.round(v * 1000)}ms`}
            onChange={(v) => update("delay", "time", v)} />
          <Knob value={track.effects.delay.feedback} min={0} max={0.9} step={0.01} label="FDBK" format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => update("delay", "feedback", v)} />
        </div>
      </div>

      {/* EQ */}
      <div className={`fx-unit ${track.effects.eq.enabled ? "fx-active" : ""}`}>
        <button className="fx-power" onClick={() => toggle("eq", track.effects.eq.enabled)}>
          <div className="fx-power-dot" />
        </button>
        <span className="fx-name">EQ</span>
        <div className="fx-knobs">
          <div className="fx-select-group">
            <span className="knob-label">TYPE</span>
            <select className="fx-select" value={track.effects.eq.type} onChange={(e) => update("eq", "type", e.target.value)}>
              <option value="lowpass">LPF</option>
              <option value="highpass">HPF</option>
              <option value="bandpass">BPF</option>
              <option value="peaking">PEAK</option>
            </select>
          </div>
          <Knob value={track.effects.eq.frequency} min={20} max={20000} step={1} label="FREQ" format={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${Math.round(v)}`}
            onChange={(v) => update("eq", "frequency", v)} />
          <Knob value={track.effects.eq.q} min={0.1} max={20} step={0.1} label="Q"
            onChange={(v) => update("eq", "q", v)} />
          <Knob value={track.effects.eq.gain} min={-20} max={20} step={0.5} label="GAIN" format={(v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}`}
            onChange={(v) => update("eq", "gain", v)} />
        </div>
      </div>

      {/* DISTORTION */}
      <div className={`fx-unit ${track.effects.distortion.enabled ? "fx-active" : ""}`}>
        <button className="fx-power" onClick={() => toggle("distortion", track.effects.distortion.enabled)}>
          <div className="fx-power-dot" />
        </button>
        <span className="fx-name">DIST</span>
        <div className="fx-knobs">
          <Knob value={track.effects.distortion.wet} min={0} max={1} step={0.01} label="MIX" format={(v) => `${Math.round(v * 100)}%`}
            onChange={(v) => update("distortion", "wet", v)} />
          <Knob value={track.effects.distortion.amount} min={1} max={100} step={1} label="DRIVE"
            onChange={(v) => update("distortion", "amount", v)} />
        </div>
      </div>
    </div>
  );
}
