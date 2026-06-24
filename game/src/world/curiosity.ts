/**
 * News pulls a newcomer (BACKLOG-345) — grove news (342) that travels the bowl should *move a body*,
 * not just a memory. A bowl dino that has only *heard* about the pond but never crossed itself is the
 * one curiosity tugs across next: the ambient migration roll prefers a grove-curious dino over a
 * coin-flip. Naturally one-time — once it crosses it joins `groveVisited` and is no longer curious.
 *
 * Pure TypeScript (no Phaser, no AI): the predicate runs in Node for tests.
 */

import { GROVE_NEWS_TOKEN } from './groveword';
import { BOWL_ID } from './zones';

/**
 * Is this dino pulled toward the grove by hearsay? True iff it lives in the bowl, has never crossed
 * (`name ∉ visited`), and carries grove news in memory — first-hand or heard, both contain the token.
 * A dino that actually *went* is excluded by `visited`, so only the un-traveled are pulled.
 */
export function groveCurious(
  events: readonly string[],
  visited: readonly string[],
  name: string,
  homeZone: string,
): boolean {
  return homeZone === BOWL_ID && !visited.includes(name) && events.some((e) => e.includes(GROVE_NEWS_TOKEN));
}
