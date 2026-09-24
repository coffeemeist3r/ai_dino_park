/**
 * Call and answer (BACKLOG-193) — how a dino answers *you*, as opposed to how it sounds.
 *
 * The voicebox has been a tell about the dino since cycle 44: `chirpParams` derives a call from
 * birth traits and nothing else, so the bowl made the identical sound at the identical moment
 * whether you were greeting a stranger or the dino you had fed every day for a week. This module is
 * the other half — the keeper's own call, and the answer that comes back late and flat from a dino
 * that barely knows you, or almost on top of you and eager from one that does.
 *
 * Pure: no Phaser, no AudioContext, Node-testable. Derived from `chirpParams` rather than
 * synthesized fresh, exactly as `distressParams` is — one voice, read differently.
 */

import { chirpParams, type ChirpParams } from './chirp';
import type { Personality } from '../ai/personality';
import { HEARTS_MAX } from '../social/friendship';

/**
 * The watcher's hail — plain, two pips, no bend. The keeper is not a creature and must not sound
 * like one.
 *
 * 1020 Hz is picked against `chirpParams`' own arithmetic, not against today's roster:
 * `pitchHz = 120 + 780 * clamp01(height)` cannot exceed 900 for *any* personality vector, so the
 * hail sits above the whole cast by construction and stays there when new dinos hatch. (`THUNK`, the
 * glass rap, is 90 Hz — below everything for the same kind of reason.)
 */
export const KEEPER_HAIL: ChirpParams = { pitchHz: 1020, lengthMs: 140, wobble: 0, notes: 2 };

/** How long a dino at zero hearts leaves the keeper hanging, ms. */
export const ANSWER_SLOW_MS = 780;

/** How fast a dino at full hearts answers, ms. Short, but never zero — an answer needs a gap to be one. */
export const ANSWER_FAST_MS = 90;

/** Past this many hearts the answer gains a pip: the dino has more to say. */
export const EAGER_PIP_HEARTS = 7;

const clampHearts = (h: number) => Math.min(HEARTS_MAX, Math.max(0, h));

/** The pause between the keeper's hail and the dino's answer. Monotone non-increasing in hearts. */
export function answerDelayMs(hearts: number): number {
  const w = clampHearts(hearts) / HEARTS_MAX;
  return Math.round(ANSWER_SLOW_MS - (ANSWER_SLOW_MS - ANSWER_FAST_MS) * w);
}

/**
 * The dino's own call, warmed by how much it likes you.
 *
 * At zero hearts this is **byte-identical** to `chirpParams(t)`: a stranger sounds exactly as it has
 * since cycle 44, so this can only ever be a gain and never a regression on a voice somebody already
 * knows. Warmth then shortens the call, bends it further, adds a pip past seven hearts, and lifts
 * the pitch — the lift held deliberately to 8%, because the entire worth of the voicebox is that you
 * can tell Twitch from Mossback, and an eagerness that outran the cast's own 148-797 Hz spread would
 * destroy the thing it decorates.
 */
export function answerParams(t: Personality, hearts: number): ChirpParams {
  const base = chirpParams(t);
  const h = clampHearts(hearts);
  if (h === 0) return base;
  const w = h / HEARTS_MAX;
  return {
    pitchHz: Math.round(base.pitchHz * (1 + 0.08 * w)),
    lengthMs: Math.round(base.lengthMs * (1 - 0.25 * w)),
    wobble: Math.min(1, base.wobble + 0.3 * w),
    notes: base.notes + (h >= EAGER_PIP_HEARTS ? 1 : 0),
  };
}
