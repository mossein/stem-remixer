export interface SessionInfo {
  id: string;
  filename: string;
  bpm: number | null;
  duration: number | null;
  stems: string[];
  status: "processing" | "ready" | "error";
  created_at: string;
  error?: string;
}

export interface UploadResponse {
  session_id: string;
  status: string;
}

export interface EffectParams {
  enabled: boolean;
  wet: number;
}

export interface ReverbParams extends EffectParams {
  preset: string;
}

export interface DelayParams extends EffectParams {
  time: number;
  feedback: number;
}

export interface EQParams extends EffectParams {
  type: BiquadFilterType;
  frequency: number;
  q: number;
  gain: number;
}

export interface DistortionParams extends EffectParams {
  amount: number;
}

export interface TrackState {
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  effects: {
    reverb: ReverbParams;
    delay: DelayParams;
    eq: EQParams;
    distortion: DistortionParams;
  };
}

export const STEM_COLORS: Record<string, string> = {
  vocals: "#e74c3c",
  drums: "#f39c12",
  bass: "#2ecc71",
  other: "#3498db",
};
