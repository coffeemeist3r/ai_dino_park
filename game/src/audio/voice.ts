/**
 * The bowl's voicebox (BACKLOG-191) — the ONLY file that touches WebAudio.
 * Everything is synthesized from chirp.ts parameters: no audio assets, no
 * downloads, no keys (CHARTER: the medium is code).
 *
 * Autoplay safety: no AudioContext exists until unlockAudio() runs, and that is
 * called only from the scene's existing first-input seam (markActive — every
 * keydown and pointerdown). Phone Chrome never sees a pre-gesture context.
 *
 * Kept QUIET by design: master gain 0.12, calls ≤ 350 ms — a desk companion.
 */

import { SOUND_KEY, THUNK, type ChirpParams } from './chirp';

const MASTER_GAIN = 0.12;

let ctx: AudioContext | null = null;
let mutedCache: boolean | null = null;

/** Create/resume the context. Call ONLY from a user-gesture handler. */
export function unlockAudio(): void {
  if (typeof AudioContext === 'undefined') return;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
}

/** 'none' until the first gesture; then the context's own state. */
export function audioState(): 'none' | AudioContextState {
  return ctx ? ctx.state : 'none';
}

export function soundMuted(): boolean {
  if (mutedCache === null) {
    try {
      mutedCache = localStorage.getItem(SOUND_KEY) === 'off';
    } catch {
      mutedCache = false; // storage denied — default on, session-only
    }
  }
  return mutedCache;
}

export function setSoundMuted(off: boolean): void {
  mutedCache = off;
  try {
    localStorage.setItem(SOUND_KEY, off ? 'off' : 'on');
  } catch { /* storage denied — the session cache still applies */ }
}

/** Synthesize one call: `notes` short pips, pitch bending up by `wobble`. */
export function playChirp(p: ChirpParams): void {
  if (soundMuted() || !ctx || ctx.state !== 'running') return;
  const t0 = ctx.currentTime + 0.01;
  const pip = p.lengthMs / 1000 / p.notes;
  for (let i = 0; i < p.notes; i++) {
    const start = t0 + i * pip * 1.15; // a hair of air between pips
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    // Each successive pip sits slightly higher; wobble bends within the pip.
    const base = p.pitchHz * (1 + i * 0.08);
    osc.frequency.setValueAtTime(base, start);
    osc.frequency.linearRampToValueAtTime(base * (1 + p.wobble * 0.25), start + pip * 0.8);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(MASTER_GAIN, start + pip * 0.15);
    gain.gain.linearRampToValueAtTime(0, start + pip);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + pip + 0.02);
  }
}

/** The glass rap — a dull sine knock, lower and plainer than any dino. */
export function playThunk(): void {
  if (soundMuted() || !ctx || ctx.state !== 'running') return;
  const t0 = ctx.currentTime + 0.005;
  const dur = THUNK.lengthMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(THUNK.pitchHz, t0);
  osc.frequency.exponentialRampToValueAtTime(THUNK.pitchHz * 0.6, t0 + dur);
  gain.gain.setValueAtTime(MASTER_GAIN * 1.4, t0); // a knock hits, then dies fast
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}
