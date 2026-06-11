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
