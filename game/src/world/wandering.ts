/**
 * Homebody or wanderer (BACKLOG-361) — what a life of crossings adds up to.
 *
 * The park has recorded crossings as facts for fifty cycles and never once counted them. `SeenZones` (364)
 * knows *where* a dino has stood, `Pioneers` (343) knows who was first, `LeftDays` (362) knows *when* it
 * last left, `CameFrom` (347) knows the ground it is still full of. Every one of those is about a single
 * journey. None of them can answer the question a four-ground chain finally makes worth asking: over a
 * life, how much of this park has this animal actually walked?
 *
 * The standing takes **two** dimensions, because either alone lies. A dino that has bounced bowl↔grove nine
 * times has *moved* a lot and *gone* nowhere; a dino that walked to the Hollow once and stayed has gone as
 * far as this park allows. So: **crossings** (how often — the one thing here that has to be counted and
 * kept) and **reach** (how far from where it began — derived every read off `seenZones` through 475's
 * `hopsBetween`, never stored, so a fifth ground or a re-linked map re-reads correctly instead of carrying a
 * stale number).
 *
 * Its origin needs no new record either: `seenZones[name][0]` is the ground it was first marked as seeing,
 * which is its spawn tile for a founder and its hatch ground for a hatchling — already the first thing the
 * park ever wrote down about it.
 *
 * Deliberately a **lifetime standing, not a beat**: no bubble, no ticker, no memory. Four beats already
 * contend at the crossing instant (339/451/452/457) and 347 added the fifth last cycle. This one only ever
 * shows up in the book, and it only ever grows.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene owns the record, the two arrival seams and the book.
 */

import { hopsBetween } from './distance';

/** dino name → how many times it has ever arrived on a new ground. */
export type Crossings = Record<string, number>;

/** Two grounds out is a wanderer. On a four-long chain that is genuinely most of the park — and it is a
 *  *reach* threshold rather than a crossing count on purpose, so pacing back and forth never earns it. */
export const WANDERER_REACH = 2;

/** How a dino's travel history reads. */
export type WanderStanding = 'homebody' | 'rambler' | 'wanderer';

/** Count one arrival. Mutates in place and returns the new total — the `markSeen`/`recordPioneer` contract,
 *  so all three arrival-seam records read alike. */
export function recordCrossing(map: Crossings, name: string): number {
  return (map[name] = (map[name] ?? 0) + 1);
}

/** How many times this dino has crossed; 0 for one that never has (and for an unknown name). */
export function crossingsOf(map: Crossings, name: string): number {
  return map[name] ?? 0;
}

/** The ground this dino began on — the first it was ever marked as seeing. */
export function originOf(seen: readonly string[] | undefined): string | undefined {
  return seen?.[0];
}

/**
 * The greatest hop-distance from `origin` to any ground this dino has stood on. 0 for a dino that has only
 * ever stood where it began, and for an absent/unknown origin.
 *
 * A ground that is genuinely unreachable from the origin (`hopsBetween` → null) is **skipped**, not counted
 * as 0 — on a future map with a detached ground, having stood somewhere you cannot walk back from should not
 * quietly read as having gone nowhere.
 */
export function reachOf(seen: readonly string[] | undefined, origin: string | undefined): number {
  if (!origin || !seen) return 0;
  let far = 0;
  for (const zone of seen) {
    const hops = hopsBetween(origin, zone);
    if (hops !== null && hops > far) far = hops;
  }
  return far;
}

/**
 * What this travel history makes the dino.
 *
 * A dino that has never crossed is a **homebody** whatever its reach says — reach is not consulted at all in
 * that branch, so a fabricated or stale `seenZones` entry can never turn a dino that has never left into a
 * traveller. Above that, distance decides: `WANDERER_REACH` grounds out is a wanderer, anything less is a
 * rambler that moves without going far.
 */
export function wanderStanding(crossings: number, reach: number): WanderStanding {
  if (crossings <= 0) return 'homebody';
  return reach >= WANDERER_REACH ? 'wanderer' : 'rambler';
}

/**
 * How it reads in the collection book. The homebody form names the ground it has never left (the standing
 * *is* that ground); the other two carry both numbers, so the read is legible and checkable at once.
 */
export function wanderBookLine(
  standing: WanderStanding,
  crossings: number,
  reach: number,
  originName: string,
): string {
  if (standing === 'homebody') return `a homebody — never left ${originName}`;
  const times = `${crossings} crossing${crossings === 1 ? '' : 's'}`;
  const out = reach === 1 ? '1 ground out' : `${reach} grounds out`;
  return `a ${standing} — ${times}, ${out}`;
}
