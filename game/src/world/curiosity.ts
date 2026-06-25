/**
 * News pulls a newcomer (BACKLOG-345) — grove news (342) that travels the bowl should *move a body*,
 * not just a memory. A bowl dino that has only *heard* about the pond but never crossed itself is the
 * one curiosity tugs across next: the ambient migration roll prefers a grove-curious dino over a
 * coin-flip. Naturally one-time — once it crosses it joins `groveVisited` and is no longer curious.
 *
 * Drew them across (BACKLOG-355) — grade that pull by *how fresh* the telling is. A dino just told to
 * its face (the grove token sits among its most-recent memories) is dragged across ahead of one whose
 * news has slid toward the back of the ring into mere ambient awareness. Same news, a stronger tug when
 * it's still ringing in your ears. The grove pull is now a 0/1/2 strength, not a bare boolean.
 *
 * Pure TypeScript (no Phaser, no AI): both predicates run in Node for tests.
 */

import { GROVE_NEWS_TOKEN } from './groveword';
import { BOWL_ID } from './zones';

/** A grove telling within the last N memories counts as *fresh* — the strong (told-to-your-face) pull. */
export const GROVE_TELL_RECENT = 3;

/**
 * How hard the grove tugs this dino (BACKLOG-355): 0 = no pull (it went already, lives in the grove, or
 * carries no grove news), 1 = ambient (it heard, but the news has aged toward the back of its memory
 * ring), 2 = freshly told (the grove token is among its most-recent `GROVE_TELL_RECENT` memories).
 * A dino that actually *went* is excluded by `visited`, so only the un-traveled are pulled at all.
 */
export function grovePull(
  events: readonly string[],
  visited: readonly string[],
  name: string,
  homeZone: string,
): 0 | 1 | 2 {
  if (homeZone !== BOWL_ID || visited.includes(name)) return 0;
  if (!events.some((e) => e.includes(GROVE_NEWS_TOKEN))) return 0;
  const recent = events.slice(-GROVE_TELL_RECENT);
  return recent.some((e) => e.includes(GROVE_NEWS_TOKEN)) ? 2 : 1;
}

/**
 * Is this dino pulled toward the grove by hearsay at all (BACKLOG-345)? Preserved exactly as the
 * any-strength predicate: true iff `grovePull` is non-zero. 355 grades *how* strongly via `grovePull`.
 */
export function groveCurious(
  events: readonly string[],
  visited: readonly string[],
  name: string,
  homeZone: string,
): boolean {
  return grovePull(events, visited, name, homeZone) > 0;
}
