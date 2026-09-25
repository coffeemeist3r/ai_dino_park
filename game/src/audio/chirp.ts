/**
 * Dino voices (BACKLOG-191) — pure trait→synth-parameter mapping. No Phaser, no
 * AudioContext, no DOM: Vitest runs this in Node. The browser side is voice.ts.
 *
 * The mapping is the whole point: a dino's voice IS its personality, so the
 * first sound the bowl ever makes is already a tell. Solitary, timid creatures
 * squeak high (small skittish things); social, brave ones rumble low (big
 * confident things). Energy sets how clipped the call is, curiosity how bendy,
 * warmth how many pips. With the founders' name-seeded traits this spreads the
 * cast 148–797 Hz — five distinct voices from five names, nothing hand-tuned.
 */

import type { Personality } from '../ai/personality';

export interface ChirpParams {
  /** Base pitch, 120–900 Hz. */
  pitchHz: number;
  /** Total call length, 80–350 ms. */
  lengthMs: number;
  /** Pitch bend across the call, 0–1. */
  wobble: number;
  /** Number of short pips the call splits into, 1–3. */
  notes: number;
}

/** localStorage key for the per-device sound toggle: 'on' | 'off' (default on). */
export const SOUND_KEY = 'dino.sound';

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function chirpParams(t: Personality): ChirpParams {
  // Solitary + timid = small and skittish = high voice; social + brave = low.
  const height = clamp01(0.6 * (1 - t.sociability) + 0.4 * (1 - t.bravery));
  const pitchHz = Math.round(120 + 780 * height);
  // Energetic dinos clip their calls short; calm ones let them ring.
  const lengthMs = Math.round(350 - 270 * clamp01(t.energy));
  const wobble = clamp01(t.curiosity);
  const notes = 1 + Math.round(clamp01(t.agreeableness) * 2);
  return { pitchHz, lengthMs, wobble, notes };
}

/** The glass rap: one low, short, plain knock — the bowl itself, not a dino. */
export const THUNK: ChirpParams = { pitchHz: 90, lengthMs: 120, wobble: 0, notes: 1 };

/**
 * The distress register (BACKLOG-194): the same voice, frightened. Pitch rises,
 * the call clips short, the bend sharpens, and it comes out as a two-pip yelp.
 * Strictly higher and strictly shorter than the base call for every legal trait
 * vector (base pitch caps at 900 < 1100, base length floors at 80 > 60), and
 * monotone below the pitch cap — so Twitch's yelp stays above Mossback's.
 */
export function distressParams(t: Personality): ChirpParams {
  const base = chirpParams(t);
  return {
    pitchHz: Math.min(1100, Math.round(base.pitchHz * 1.35)),
    lengthMs: Math.max(60, Math.round(base.lengthMs * 0.55)),
    wobble: Math.min(1, base.wobble + 0.3),
    notes: 2,
  };
}

/** One parent, for the blend read (BACKLOG-195): its name and the call its own traits make. */
export interface VoiceParent {
  name: string;
  params: ChirpParams;
}

/**
 * The book's voice line (BACKLOG-195) — what this dino sounds like, in words.
 *
 * A hatchling's cry has been a blend of its parents' since cycle 44 and nobody could tell: `hatch`
 * blends traits per-axis (`blendTraits`), `chirpParams` derives the call from traits, so the blend
 * was already happening where it could not be heard or read. Re-deriving it would have changed
 * nothing. What was missing was somewhere to *see* it — so when both parents are still in the
 * roster, the line says where this voice sits between the two it came from.
 *
 * The relation is derived from the numbers rather than assumed: `blendTraits` adds a small jitter,
 * so a child genuinely can land outside its parents' pair, and a line that said "between" anyway
 * would be a line that lies. Pure.
 */
export function voiceLine(p: ChirpParams, parents?: [VoiceParent, VoiceParent]): string {
  const base = `🔊 voice · ${p.pitchHz} Hz · ${p.notes} pip${p.notes === 1 ? '' : 's'}`;
  if (!parents) return base;
  const [a, b] = parents;
  const lo = Math.min(a.params.pitchHz, b.params.pitchHz);
  const hi = Math.max(a.params.pitchHz, b.params.pitchHz);
  const rel = p.pitchHz > hi ? 'above both' : p.pitchHz < lo ? 'below both' : 'between';
  return `${base} — ${rel} ${a.name} ${a.params.pitchHz} and ${b.name} ${b.params.pitchHz}`;
}
