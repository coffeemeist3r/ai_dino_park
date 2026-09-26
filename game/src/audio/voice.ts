/**
 * The bowl's voicebox (BACKLOG-191) — the ONLY file that touches WebAudio.
 * Everything is synthesized from chirp.ts parameters: no audio assets, no
 * downloads, no keys (CHARTER: the medium is code).
 *
 * Autoplay safety: no AudioContext exists until unlockAudio() runs, and that is
 * called only from the scene's existing first-input seam (markActive — every
 * keydown and pointerdown). Phone Chrome never sees a pre-gesture context.
 *
 * Kept QUIET by design: levels live in `mix.ts` (0.08–0.20), calls ≤ 350 ms — a desk companion.
 */

import { SOUND_KEY, THUNK, type ChirpParams } from './chirp';
import { gainFor, type VoiceKind, type VoiceOpts } from './mix';

let ctx: AudioContext | null = null;
/**
 * The bus (BACKLOG-559) — the one node every voice in this park routes through, and therefore the
 * one place a future arc can reach to say "quieter, because it is far away". Held at unity: the
 * level a call plays at is `gainFor`'s answer, not the bus's.
 */
let bus: GainNode | null = null;
let mutedCache: boolean | null = null;

/** Create/resume the context. Call ONLY from a user-gesture handler. */
export function unlockAudio(): void {
  if (typeof AudioContext === 'undefined') return;
  if (!ctx) ctx = new AudioContext();
  if (!bus) {
    bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(ctx.destination); // the only destination connection in the park
  }
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

/**
 * Synthesize one call: `notes` short pips, pitch bending up by `wobble`.
 *
 * `kind` (BACKLOG-559) is what the call *is*, not how loud it should be — the level comes from
 * `gainFor`, which is pure and lives in `mix.ts`. Defaulted to 'chirp' so every existing caller
 * reads unchanged and sounds unchanged.
 *
 * `opts` (BACKLOG-206) carries where the sound is coming from. Omitted, the call plays at its kind's
 * level exactly as it always has — the scene passes a distance only for things that are standing
 * somewhere in the world.
 */
export function playChirp(p: ChirpParams, kind: VoiceKind = 'chirp', opts?: VoiceOpts): void {
  if (soundMuted() || !ctx || !bus || ctx.state !== 'running') return;
  const peak = gainFor(kind, opts);
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
    gain.gain.linearRampToValueAtTime(peak, start + pip * 0.15);
    gain.gain.linearRampToValueAtTime(0, start + pip);
    osc.connect(gain).connect(bus);
    osc.start(start);
    osc.stop(start + pip + 0.02);
  }
}

/** The glass rap — a dull sine knock, lower and plainer than any dino. */
export function playThunk(): void {
  if (soundMuted() || !ctx || !bus || ctx.state !== 'running') return;
  const t0 = ctx.currentTime + 0.005;
  const dur = THUNK.lengthMs / 1000;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(THUNK.pitchHz, t0);
  osc.frequency.exponentialRampToValueAtTime(THUNK.pitchHz * 0.6, t0 + dur);
  gain.gain.setValueAtTime(gainFor('thunk'), t0); // a knock hits, then dies fast
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(bus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}
