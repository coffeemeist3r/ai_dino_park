/**
 * Home-zone belonging (BACKLOG-341) — a dino that has lived in its current zone long enough forms an
 * attachment to it and stops drifting on every ambient migration coin-flip (274/333). "Home" stops being
 * a per-roll accident and starts to mean something: where a dino belongs becomes a legible standing in the
 * collection book, and a *settled* dino resists the wander that would otherwise carry it away.
 *
 * Pure (no Phaser): Node-testable. `WorldScene` counts tenure on the real migration cadence (`maybeMigrate`
 * runs ~every 90 s), resets it on a zone crossing, gates the migrant on `resistsMigration`, and reads
 * `settledLine` into the book. The first lore arc of Milestone 2 ("Places to belong").
 */

export type Tenure = Record<string, number>;

/** Migration rolls a dino must reside continuously in one zone before it counts as *settled* (~4×90 s ≈ 6 min). */
export const SETTLE_ROLLS = 4;

/** Probability a *settled* dino, once picked as the migrant, resists and stays put this roll (migrates less readily). */
export const SETTLED_MIGRATE_DAMP = 0.6;

/** A dino's residence tenure (rolls in its current zone); absent → 0. */
export function tenureOf(tenure: Tenure, name: string): number {
  return tenure[name] ?? 0;
}

/** Add one roll to `name`'s tenure. Pure — returns a new map, never mutates. */
export function bumpTenure(tenure: Tenure, name: string): Tenure {
  return { ...tenure, [name]: tenureOf(tenure, name) + 1 };
}

/** Reset `name`'s tenure to 0 (a fresh zone starts fresh — called on a crossing). Pure. */
export function resetTenure(tenure: Tenure, name: string): Tenure {
  return { ...tenure, [name]: 0 };
}

/** Has a dino resided long enough to call its zone home? */
export function isSettled(rolls: number, threshold: number = SETTLE_ROLLS): boolean {
  return rolls >= threshold;
}

/** Does a settled dino resist this ambient migration (stay put)? Only settled dinos ever resist. */
export function resistsMigration(settled: boolean, rand: () => number = Math.random): boolean {
  return settled && rand() < SETTLED_MIGRATE_DAMP;
}

/** The collection-book read for a settled dino's home zone (empty caller-side when not settled). */
export function settledLine(zoneName: string): string {
  return `at home in ${zoneName}`;
}
