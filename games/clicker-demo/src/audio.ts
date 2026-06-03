// Tiny synthesized sound module for the clicker. Everything is generated with
// the Web Audio API so there are no asset files to host or load. The single
// AudioContext is created lazily and resumed on the first user gesture to
// satisfy browser autoplay policies.

const MUTE_KEY = "sauce-clicker:muted";

let ctx: AudioContext | null = null;
let muted = false;

type AudioCtor = typeof AudioContext;

function getCtor(): AudioCtor | undefined {
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
  );
}

/** Read the persisted mute preference. Call once on startup. */
export function initAudio(): void {
  muted = localStorage.getItem(MUTE_KEY) === "1";
}

function ensureCtx(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    const Ctor = getCtor();
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Prime/resume the audio context from within a user gesture handler. */
export function resumeAudio(): void {
  ensureCtx();
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  if (muted) {
    if (ctx) void ctx.suspend();
  } else {
    ensureCtx();
  }
}

interface ToneOptions {
  freq: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  startAt?: number;
  sweepTo?: number;
}

function tone(c: AudioContext, opts: ToneOptions): void {
  const { freq, duration, type = "sine", gain = 0.2, startAt = 0, sweepTo } = opts;
  const t0 = c.currentTime + startAt;
  const osc = c.createOscillator();
  const env = c.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (sweepTo) osc.frequency.exponentialRampToValueAtTime(sweepTo, t0 + duration);

  // Quick attack, smooth exponential decay — avoids clicks/pops.
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

  osc.connect(env).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.03);
}

/** Short blip per click. Pitch rises slightly with the running combo. */
export function playClick(combo = 0): void {
  const c = ensureCtx();
  if (!c) return;
  const base = 420 + Math.min(combo, 50) * 5;
  tone(c, { freq: base, sweepTo: base * 1.6, duration: 0.07, type: "triangle", gain: 0.16 });
}

/** Urgent beep used for each of the final seconds. */
export function playWarning(): void {
  const c = ensureCtx();
  if (!c) return;
  tone(c, { freq: 920, duration: 0.12, type: "square", gain: 0.1 });
}

/** Celebratory rising arpeggio when the round ends. */
export function playFanfare(): void {
  const c = ensureCtx();
  if (!c) return;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
  notes.forEach((f, i) => {
    tone(c, { freq: f, duration: 0.34, type: "triangle", gain: 0.15, startAt: i * 0.1 });
  });
}

/** Soft tick used during the 3-2-1 ready countdown. */
export function playTick(): void {
  const c = ensureCtx();
  if (!c) return;
  tone(c, { freq: 660, duration: 0.1, type: "sine", gain: 0.12 });
}
