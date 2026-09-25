/**
 * The mix (BACKLOG-559) — how loud each kind of call is, decided in one pure place.
 *
 * Until this cycle there was no object in this park representing *how loud the bowl is*:
 * `voice.ts` built a fresh `oscillator → gain → ctx.destination` chain per call and multiplied a
 * module constant into the envelope, once in `playChirp` and again (times 1.4, inline) in
 * `playThunk`. So a call's loudness could only ever be decided by the call itself, and three queued
 * arcs — 206 (distance), 204 (a cry that carries over the chatter), 202 (a reply from across the
 * bowl) — each wanted the same seam and would each have added its own copy of the arithmetic inside
 * the one file the CHARTER keeps WebAudio locked in.
 *
 * This module is that seam, and it knows nothing about WebAudio: Vitest runs it in Node.
 *
 * Two of the four levels are **identity cases** — exactly the numbers the park already made, so no
 * voice anyone knows moves this cycle. The other two are the point: they were not expressible before
 * and they are both audible on a fresh save.
 */

export type VoiceKind = 'chirp' | 'hail' | 'distress' | 'thunk';

/**
 * The union, made iterable. A totality test walks this rather than trusting the type, so adding a
 * kind without giving it a level fails here instead of returning `undefined` at a call site.
 */
export const VOICE_KINDS: readonly VoiceKind[] = ['chirp', 'hail', 'distress', 'thunk'];

/** The bowl's base level since cycle 44. Quiet by design — a desk companion, not a game. */
const BASE = 0.12;

const LEVEL: Record<VoiceKind, number> = {
  /** Identity case: a dino's own call, exactly as loud as it has always been. */
  chirp: BASE,
  /** Identity case: the glass rap, the old inline `* 1.4` written where it can be read. */
  thunk: BASE * 1.4,
  /**
   * The keeper's hail (193) sits *back*. It is the one call in this park that is not a creature, and
   * since last cycle it has been playing at exactly a dinosaur's level — so a greet read as two
   * equal beeps rather than as you calling and something answering.
   */
  hail: 0.08,
  /**
   * A cry carries (194). `distressParams` shortens the call, and a shorter call at the same gain is
   * a smaller sound — so the one noise in the bowl that is meant to cut through has been the
   * quietest thing in it.
   */
  distress: 0.2,
};

/** The 0–1 multiplier a call of this kind plays at. */
export function gainFor(kind: VoiceKind): number {
  return LEVEL[kind];
}
