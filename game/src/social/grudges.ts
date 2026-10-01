/**
 * Who does not get on with whom (BACKLOG-574). Pure (no Phaser).
 *
 * The grudge graph is the bond graph's twin — the same pair-keyed 0–100 map, moved by the same `strengthen`
 * and cooled by the same `driftBonds` — so this file holds only what makes it cold: its bar, its feed, its
 * (slower) cooling, and the book's words for it.
 */

import { closestFriend, type Bonds } from './bonds';

/** The grudge at which the book names a rival, and at which two dinos square off when they meet (024). */
export const RIVAL_BAR = 20;

/** What one contested drop at the hatch adds between the two dinos who fought over it. */
export const GRUDGE_PER_CONTEST = 6;

/**
 * The share of its distance to 0 a grudge gives up each ambient step — a quarter of `BOND_DRIFT`, so a feud
 * nothing feeds outlasts a sitting (the founding 40 takes ~35 real minutes of watching to cool to the bar) and still ends.
 */
export const GRUDGE_DRIFT = 0.001;

/** The dino `name` gets on worst with, among `others` — null when no grudge clears `RIVAL_BAR`. */
export function worstRival(name: string, grudges: Bonds, others: readonly string[]): string | null {
  return closestFriend(name, grudges, [...others], RIVAL_BAR);
}

/** The book's line for a rival. */
export function rivalLine(rival: string): string {
  return `😒 doesn't get on with ${rival}`;
}
