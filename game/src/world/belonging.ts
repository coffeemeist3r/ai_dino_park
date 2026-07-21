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

/**
 * Homecoming from the road (BACKLOG-452) — the return half of migration. A crossing (334) has always been
 * one-way: tenure resets, the zone a dino *belonged* to forgets it, and walking back in reads exactly like
 * arriving somewhere new. A dino's **root** is the zone it was last settled in; crossing back into it is a
 * homecoming — it resettles on arrival (it never stopped belonging here) and the residents notice.
 */

/** Where each dino belongs: name → the zone id it last settled in. Absent → it has never settled anywhere. */
export type Roots = Record<string, string>;

/** The zone a dino last settled in, or undefined if it never has. */
export function rootOf(roots: Roots, name: string): string | undefined {
  return roots[name];
}

/** Record `zone` as where `name` belongs. Pure — returns a new map, never mutates (no-op if unchanged). */
export function rememberRoot(roots: Roots, name: string, zone: string): Roots {
  if (roots[name] === zone) return roots;
  return { ...roots, [name]: zone };
}

/** Is this crossing a homecoming — arriving back in the zone this dino settled in, from somewhere else? */
export function isHomecoming(roots: Roots, name: string, from: string, to: string): boolean {
  return from !== to && rootOf(roots, name) === to;
}

/** The bubble over a dino that just walked back into the ground it belongs to. */
export function homecomingLine(): string {
  return '🏡';
}

/** The ticker line for a homecoming. */
export function homecomingEvent(name: string, zoneName: string): string {
  return `🏡 ${name} came home to ${zoneName}`;
}

/** The trace the returner keeps; rides the memory store into its next greeting. */
export function homecomingMemory(zoneName: string): string {
  return `you came back to ${zoneName} — back where you belong`;
}

/** The trace the resident who was still there keeps. */
export function welcomeMemory(returner: string, zoneName: string): string {
  return `you welcomed ${returner} back to ${zoneName}`;
}

/** The ticker line for the welcome. */
export function welcomeEvent(resident: string, returner: string): string {
  return `👋 ${resident} welcomed ${returner} home`;
}

/** The bond a welcome home is worth — gentler than a shared meal (3): a nod at the edge, not a meal. */
export const WELCOME_BOND = 2;
