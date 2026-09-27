/**
 * The voice's clock (BACKLOG-562) — a beat, written down as *when* each call in it plays.
 *
 * Until now every deferred call in the park was a bespoke `delayedCall` in `WorldScene` with its own
 * two guards written inline ("the dino left during the gap", "mute flipped during the gap"): 193's
 * answer, 202's callback, and the dawn chorus's loop, which only had one of the two. A beat is now a
 * cue list built here, pure and Node-testable, and the scene has exactly one player that walks it and
 * owns both guards once.
 *
 * No Phaser, no WebAudio. `who` absent means the keeper: it is standing where the listener is, so it
 * carries no distance.
 */

import { chirpParams, type ChirpParams } from './chirp';
import { answerDelayMs, answerParams, KEEPER_HAIL } from './answer';
import type { VoiceKind } from './mix';
import type { Personality } from '../ai/personality';
import { callbackDelayMs } from '../world/distress';

export interface Cue {
  /** ms after the beat begins. */
  atMs: number;
  /** The dino calling, re-resolved by name when the cue fires. Absent: the keeper. */
  who?: string;
  params: ChirpParams;
  kind: VoiceKind;
}

/** Ascending by `atMs`; ties keep their given order. Every builder returns through this. */
export function byTime(cues: Cue[]): Cue[] {
  return cues.map((c, i) => [c, i] as const).sort((a, b) => a[0].atMs - b[0].atMs || a[1] - b[1]).map(([c]) => c);
}

/** 193: the keeper's hail on this frame, the dino's warmed answer after a pause that shrinks with hearts. */
export function answerCues(who: string, t: Personality, hearts: number): Cue[] {
  return byTime([
    { atMs: 0, params: KEEPER_HAIL, kind: 'hail' },
    { atMs: answerDelayMs(hearts), who, params: answerParams(t, hearts), kind: 'chirp' },
  ]);
}

/** 202: the friend calls back in its ordinary voice, sooner the closer they are. */
export function callbackCues(who: string, t: Personality, bond: number): Cue[] {
  return [{ atMs: callbackDelayMs(bond), who, params: chirpParams(t), kind: 'chirp' }];
}

/**
 * The roster guard, once. A cue with no `who` is the keeper and always fires; a named cue fires only
 * if its dino still resolves — one that left the roster during the gap is silent. The scene's player
 * calls this, so the unit that pins it and the game cannot disagree.
 */
export function dueCue<D>(cue: Cue, resolve: (name: string) => D | undefined): { dino: D | null } | null {
  if (cue.who === undefined) return { dino: null };
  const d = resolve(cue.who);
  return d === undefined ? null : { dino: d };
}
