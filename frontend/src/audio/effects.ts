import { getAudioContext } from "./engine";

export interface EffectNode {
  input: AudioNode;
  output: AudioNode;
  dispose: () => void;
  setWet: (value: number) => void;
  update: (params: Record<string, unknown>) => void;
}

function createDryWet(
  ctx: AudioContext,
  effectNode: AudioNode
): { input: GainNode; output: GainNode; setWet: (v: number) => void } {
  const input = ctx.createGain();
  const output = ctx.createGain();
  const dryGain = ctx.createGain();
  const wetGain = ctx.createGain();

  input.connect(dryGain);
  input.connect(effectNode);
  effectNode.connect(wetGain);
  dryGain.connect(output);
  wetGain.connect(output);

  return {
    input,
    output,
    setWet: (v: number) => {
      wetGain.gain.value = v;
      dryGain.gain.value = 1 - v;
    },
  };
}

const impulseCache = new Map<string, AudioBuffer>();

async function loadImpulse(preset: string): Promise<AudioBuffer> {
  if (impulseCache.has(preset)) return impulseCache.get(preset)!;

  // Generate synthetic impulse responses
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate;
  const lengths: Record<string, number> = {
    room: 0.8,
    hall: 2.5,
    plate: 1.5,
  };
  const duration = lengths[preset] || 1.5;
  const length = sampleRate * duration;
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < length; i++) {
      const decay = Math.exp((-3 * i) / length);
      data[i] = (Math.random() * 2 - 1) * decay;
    }
  }

  impulseCache.set(preset, buffer);
  return buffer;
}

export function createReverb(): EffectNode {
  const ctx = getAudioContext();
  const convolver = ctx.createConvolver();
  const dw = createDryWet(ctx, convolver);

  // Load default impulse
  loadImpulse("hall").then((buf) => (convolver.buffer = buf));

  return {
    input: dw.input,
    output: dw.output,
    setWet: dw.setWet,
    update: (params) => {
      if (params.preset) {
        loadImpulse(params.preset as string).then(
          (buf) => (convolver.buffer = buf)
        );
      }
    },
    dispose: () => {
      convolver.disconnect();
    },
  };
}

export function createDelay(): EffectNode {
  const ctx = getAudioContext();
  const delay = ctx.createDelay(2.0);
  const feedback = ctx.createGain();
  delay.delayTime.value = 0.3;
  feedback.gain.value = 0.4;

  delay.connect(feedback);
  feedback.connect(delay);

  const dw = createDryWet(ctx, delay);

  return {
    input: dw.input,
    output: dw.output,
    setWet: dw.setWet,
    update: (params) => {
      if (params.time !== undefined)
        delay.delayTime.value = params.time as number;
      if (params.feedback !== undefined)
        feedback.gain.value = params.feedback as number;
    },
    dispose: () => {
      delay.disconnect();
      feedback.disconnect();
    },
  };
}

export function createEQ(): EffectNode {
  const ctx = getAudioContext();
  const filter = ctx.createBiquadFilter();
  filter.type = "peaking";
  filter.frequency.value = 1000;
  filter.Q.value = 1;
  filter.gain.value = 0;

  const dw = createDryWet(ctx, filter);

  return {
    input: dw.input,
    output: dw.output,
    setWet: dw.setWet,
    update: (params) => {
      if (params.type !== undefined)
        filter.type = params.type as BiquadFilterType;
      if (params.frequency !== undefined)
        filter.frequency.value = params.frequency as number;
      if (params.q !== undefined) filter.Q.value = params.q as number;
      if (params.gain !== undefined) filter.gain.value = params.gain as number;
    },
    dispose: () => {
      filter.disconnect();
    },
  };
}

function makeDistortionCurve(amount: number): Float32Array {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] =
      ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

export function createDistortion(): EffectNode {
  const ctx = getAudioContext();
  const shaper = ctx.createWaveShaper();
  shaper.curve = makeDistortionCurve(20);
  shaper.oversample = "4x";

  const dw = createDryWet(ctx, shaper);

  return {
    input: dw.input,
    output: dw.output,
    setWet: dw.setWet,
    update: (params) => {
      if (params.amount !== undefined)
        shaper.curve = makeDistortionCurve(params.amount as number);
    },
    dispose: () => {
      shaper.disconnect();
    },
  };
}

export const effectFactories: Record<string, () => EffectNode> = {
  reverb: createReverb,
  delay: createDelay,
  eq: createEQ,
  distortion: createDistortion,
};
