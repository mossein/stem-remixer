import { create } from "zustand";
import type { TrackState } from "../types";

const defaultTrackState = (): TrackState => ({
  volume: 0.8,
  pan: 0,
  muted: false,
  soloed: false,
  effects: {
    reverb: { enabled: false, wet: 0.3, preset: "hall" },
    delay: { enabled: false, wet: 0.3, time: 0.3, feedback: 0.4 },
    eq: {
      enabled: false,
      wet: 1,
      type: "peaking" as BiquadFilterType,
      frequency: 1000,
      q: 1,
      gain: 0,
    },
    distortion: { enabled: false, wet: 0.3, amount: 20 },
  },
});

interface MixerState {
  tracks: Record<string, TrackState>;
  tempo: number;
  originalBpm: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;

  initTracks: (stems: string[], bpm: number, duration: number) => void;
  setVolume: (stem: string, volume: number) => void;
  setPan: (stem: string, pan: number) => void;
  toggleMute: (stem: string) => void;
  toggleSolo: (stem: string) => void;
  setEffect: (stem: string, effect: string, params: Record<string, unknown>) => void;
  setTempo: (bpm: number) => void;
  setLoopEnabled: (enabled: boolean) => void;
  setLoop: (start: number, end: number) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
}

export const useMixerStore = create<MixerState>((set, get) => ({
  tracks: {},
  tempo: 120,
  originalBpm: 120,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,
  isPlaying: false,
  currentTime: 0,
  duration: 0,

  initTracks: (stems, bpm, duration) => {
    const tracks: Record<string, TrackState> = {};
    stems.forEach((s) => (tracks[s] = defaultTrackState()));
    set({ tracks, tempo: bpm, originalBpm: bpm, duration, loopEnd: duration });
  },

  setVolume: (stem, volume) => {
    const tracks = { ...get().tracks };
    tracks[stem] = { ...tracks[stem], volume };
    set({ tracks });
  },

  setPan: (stem, pan) => {
    const tracks = { ...get().tracks };
    tracks[stem] = { ...tracks[stem], pan };
    set({ tracks });
  },

  toggleMute: (stem) => {
    const tracks = { ...get().tracks };
    tracks[stem] = { ...tracks[stem], muted: !tracks[stem].muted };
    set({ tracks });
  },

  toggleSolo: (stem) => {
    const tracks = { ...get().tracks };
    tracks[stem] = { ...tracks[stem], soloed: !tracks[stem].soloed };
    set({ tracks });
  },

  setEffect: (stem, effect, params) => {
    const tracks = { ...get().tracks };
    const fx = { ...tracks[stem].effects };
    (fx as Record<string, unknown>)[effect] = {
      ...(fx as Record<string, Record<string, unknown>>)[effect],
      ...params,
    };
    tracks[stem] = { ...tracks[stem], effects: fx as TrackState["effects"] };
    set({ tracks });
  },

  setTempo: (bpm) => set({ tempo: bpm }),
  setLoopEnabled: (enabled) => set({ loopEnabled: enabled }),
  setLoop: (start, end) => set({ loopStart: start, loopEnd: end }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
}));
