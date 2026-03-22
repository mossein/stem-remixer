import { getAudioContext, getMasterGain } from "./engine";
import type { EffectNode } from "./effects";
import { effectFactories } from "./effects";

export class AudioTrack {
  private audioElement: HTMLAudioElement;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode;
  private panNode: StereoPannerNode;
  private muteGain: GainNode;
  private effects: Map<string, EffectNode> = new Map();
  private effectOrder: string[] = ["reverb", "delay", "eq", "distortion"];
  readonly stemName: string;

  constructor(stemName: string, url: string) {
    this.stemName = stemName;
    const ctx = getAudioContext();

    this.audioElement = new Audio();
    this.audioElement.crossOrigin = "anonymous";
    this.audioElement.src = url;
    this.audioElement.preload = "auto";

    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = 0.8;

    this.panNode = ctx.createStereoPanner();
    this.panNode.pan.value = 0;

    this.muteGain = ctx.createGain();
    this.muteGain.gain.value = 1;

    this.sourceNode = ctx.createMediaElementSource(this.audioElement);
    this.rebuildChain();
  }

  private rebuildChain() {
    // Disconnect everything
    this.sourceNode?.disconnect();
    this.gainNode.disconnect();
    this.panNode.disconnect();
    this.muteGain.disconnect();
    this.effects.forEach((fx) => {
      fx.input.disconnect();
      fx.output.disconnect();
    });

    // Build chain: source -> gain -> pan -> [effects] -> muteGate -> master
    let lastNode: AudioNode = this.sourceNode!;

    lastNode.connect(this.gainNode);
    lastNode = this.gainNode;

    lastNode.connect(this.panNode);
    lastNode = this.panNode;

    for (const name of this.effectOrder) {
      const fx = this.effects.get(name);
      if (fx) {
        lastNode.connect(fx.input);
        lastNode = fx.output;
      }
    }

    lastNode.connect(this.muteGain);
    this.muteGain.connect(getMasterGain());
  }

  setVolume(value: number) {
    this.gainNode.gain.value = value;
  }

  setPan(value: number) {
    this.panNode.pan.value = value;
  }

  setMuted(muted: boolean) {
    this.muteGain.gain.value = muted ? 0 : 1;
  }

  enableEffect(name: string) {
    if (this.effects.has(name)) return;
    const factory = effectFactories[name];
    if (!factory) return;
    const fx = factory();
    this.effects.set(name, fx);
    this.rebuildChain();
  }

  disableEffect(name: string) {
    const fx = this.effects.get(name);
    if (!fx) return;
    fx.dispose();
    this.effects.delete(name);
    this.rebuildChain();
  }

  updateEffect(name: string, params: Record<string, unknown>) {
    const fx = this.effects.get(name);
    if (fx) {
      fx.update(params);
      if (params.wet !== undefined) fx.setWet(params.wet as number);
    }
  }

  getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  dispose() {
    this.audioElement.pause();
    this.audioElement.src = "";
    this.sourceNode?.disconnect();
    this.gainNode.disconnect();
    this.panNode.disconnect();
    this.muteGain.disconnect();
    this.effects.forEach((fx) => fx.dispose());
    this.effects.clear();
  }
}
