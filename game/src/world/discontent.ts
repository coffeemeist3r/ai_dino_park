/**
 * The grumble reaches the keeper (BACKLOG-471) — governance made a care signal, and Milestone 9's last arc.
 *
 * The bank-first reserve (463) is the sharpest edge in the whole governance system: it is the one rule that
 * can look at a starving resident with food in the pantry and say no. Until now that refusal made no sound
 * at all — `pickFoodToSpend` returned null, the feed loop moved on, and the dino simply stayed starving.
 * 469 gave the *mouth* a private grievance about it and 470 let the bowl pass the policy around as a public
 * fact; both are description. This is the first time the policy's **cost** asks the keeper for something.
 *
 * Pure TypeScript (no Phaser, no AI): Node-testable. WorldScene owns the per-zone counters (deliberately
 * unpersisted — a live read of a live situation, exactly like the policy it reports) and the ticker.
 */

import { pickFoodToSpend, type FoodPile } from './foodstore';
import { feedReserve, type SpendPriority } from './governance';

/** Mouths a ground must hold short before the word reaches the glass. Two, so one unlucky moment isn't a
 *  grievance — the ticker reads as a standing, not a tic (the 221/226 shape). */
export const SHORTS_BEFORE_WORD = 2;

/**
 * Was this starving mouth held short **by the policy** — did the ground hold back food it would have spent
 * under a feed-first provider? Asks the very same `pickFoodToSpend` the spend site asks, twice: once with
 * the policy's reserve and once without. That double call is the point — the definition of "the reserve is
 * why" can never drift from the definition of the reserve, and a pile whose only stocked id sits below the
 * reserve is read correctly where a pile-total comparison would not be.
 *
 * False for `'feed'`, for a ground with no policy at all, and for an empty pantry: an empty pantry is want,
 * not a decision, and this arc is about decisions.
 */
export function heldShort(
  pile: FoodPile,
  favoriteId: string | undefined,
  p: SpendPriority | null | undefined,
): boolean {
  if (p !== 'bank') return false;
  return pickFoodToSpend(pile, favoriteId, feedReserve(p)) === null && pickFoodToSpend(pile, favoriteId, 0) !== null;
}

/**
 * Does the grievance reach the keeper right now? Threshold plus a once-per-in-game-day freshness gate, so
 * a ground that keeps saying no all day says so to the keeper once (the 226 one-visit-per-sorrow shape).
 * `lastDay` is null on a ground that has never sounded.
 */
export function soundsDiscontent(shorts: number, lastDay: number | null, day: number): boolean {
  return shorts >= SHORTS_BEFORE_WORD && lastDay !== day;
}

/** The ticker line. No leading article — two of the three zone names carry their own ("The Grove"), the
 *  same reason `storesFedLine` doesn't add one. */
export function discontentLine(zoneName: string): string {
  return `😟 ${zoneName}'s going hungry while the granary fills`;
}
