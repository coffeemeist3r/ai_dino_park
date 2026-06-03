/**
 * Homecoming nuzzle (BACKLOG-112) — "welcome back".
 *
 * Pure (no Phaser, no WebLLM): the inverse-facing half of the offline catch-up
 * (BACKLOG-106). Where `away.ts` narrates how the *cast* fared while you were
 * gone, this picks the one dino who notices *you* came back — your closest, the
 * one with the most player-friendship — and hands WorldScene a small heart-graded
 * gesture to play over it. It only fires after a genuinely long absence, so an
 * instant reload never stages a homecoming.
 */

import { heartsFromPoints, type Friendship } from '../social/friendship';

/** A "long" absence: the catch-up advanced the world by at least this many in-game minutes (6h). */
export const HOMECOMING_MIN_MINUTES = 6 * 60;

export interface Homecoming {
  /** the closest dino — highest player-friendship. */
  name: string;
  /** that dino's heart level (0..10). */
  hearts: number;
  /** the floating welcome-back line (contains the name + 👋), warmth graded by hearts. */
  line: string;
  /** the faint memory the dino keeps; WorldScene folds this into the memory store. */
  memory: string;
}

/** The closest befriended dino: max points, ties broken by lexicographically smallest name. */
function closest(friendship: Friendship): { name: string; points: number } | null {
  let best: { name: string; points: number } | null = null;
  for (const [name, points] of Object.entries(friendship)) {
    if (points <= 0) continue;
    if (!best || points > best.points || (points === best.points && name < best.name)) {
      best = { name, points };
    }
  }
  return best;
}

function homecomingLine(name: string, hearts: number): string {
  if (hearts >= 7) return `${name}: You're finally back! 👋`;
  if (hearts >= 4) return `${name}: Welcome home! 👋`;
  return `${name}: Oh — you're back. 👋`;
}

/**
 * Decide whether — and from whom — a homecoming beat plays. Returns null for a
 * short absence (below the threshold) or when no dino has any friendship yet.
 */
export function homecoming(friendship: Friendship, awayMinutes: number): Homecoming | null {
  if (awayMinutes < HOMECOMING_MIN_MINUTES) return null;
  const best = closest(friendship);
  if (!best) return null;
  const hearts = heartsFromPoints(best.points);
  return {
    name: best.name,
    hearts,
    line: homecomingLine(best.name, hearts),
    memory: 'the keeper came home after being away a while',
  };
}
