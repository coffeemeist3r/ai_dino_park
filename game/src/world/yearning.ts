/**
 * A ground you come to miss (BACKLOG-362) — the park's first migration *pull*.
 *
 * Every migration bias this park owns is a push. Scarcity empties the poorest ground (450), a hollowing one
 * makes its remaining residents lean harder to leave (460), a dry pantry sends a mouth toward a fuller one
 * (457/458), and even homesickness (340) is a pull toward a *dino*, not a place. Nothing has ever made a
 * dino leave good ground because somewhere else got under its skin.
 *
 * 343 taught the park to remember who set foot on a ground first; 364 taught it that having *been* somewhere
 * is standing you can carry. Both read the record of where each dino has been. This one gives that record a
 * clock: a ground you stood on and have been away from long enough starts calling you back.
 *
 * The record is deliberately its own small map rather than a widened `SeenZones` (364). Folding a
 * `leftDay` into that record would touch a shipped parse guard and every 364 spec to buy nothing — two
 * small records beat one clever one.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene owns the mutable map, the crossing seams and the
 * migration tiers.
 */

import type { Personality } from '../ai/personality';

/** dino → zoneId → the in-game day it last crossed *out* of that ground. */
export type LeftDays = Record<string, Record<string, number>>;

/** In-game days away before a ground starts calling. The calibration knob. */
export const YEARN_DAYS = 3;

/** A curious dino misses a place sooner — the same fact, a shorter fuse. Temperament colours the *strength*
 *  of the pull, never whether it exists. */
export const CURIOUS_YEARN_DAYS = 2;

/** Stamp the day `name` crossed out of `zone`. Overwrites an earlier stamp: what matters is the *last*
 *  time it left, not the first. */
export function markLeft(map: LeftDays, name: string, zone: string, day: number): void {
  (map[name] ??= {})[zone] = day;
}

/** Arriving somewhere ends the longing for it — you are standing in it. */
export function clearLeft(map: LeftDays, name: string, zone: string): void {
  delete map[name]?.[zone];
}

/** How long this dino waits before a ground it left starts calling. Name-seeded through `traits`, so it is
 *  deterministic and needs no model. */
export function yearnThreshold(traits?: Personality): number {
  return (traits?.curiosity ?? 0) >= 0.5 ? CURIOUS_YEARN_DAYS : YEARN_DAYS;
}

/**
 * The ground this dino misses: among `reachable` (its home's neighbours), the one it left **longest** ago,
 * provided that stretch is at least `threshold` in-game days. Never its own home, however stale that
 * ground's stamp is — you cannot miss where you are standing.
 *
 * **Deterministic.** `reachable` is walked in input order (`ZONE_LINKS` order at the call site) and a
 * strict `<` on the recorded day means the first neighbour wins a tie — the `richestNeighbor` /
 * `unsettledNeighbor` precedent, and the BACKLOG-456 rule against `Math.random()` in a migration decision.
 */
export function yearnedZone(
  map: LeftDays,
  name: string,
  home: string,
  day: number,
  reachable: readonly string[],
  threshold: number,
): string | null {
  const left = map[name];
  if (!left) return null;
  let best: string | null = null;
  let bestDay = Infinity;
  for (const zone of reachable) {
    if (zone === home) continue;
    const leftDay = left[zone];
    if (leftDay === undefined || day - leftDay < threshold) continue;
    if (leftDay < bestDay) {
      bestDay = leftDay;
      best = zone;
    }
  }
  return best;
}

/** A stable prefix — the tell that a remembered line is a longing. */
const YEARN_MARK = '💭 haven’t seen ';

/** The longing, in the dino's own frame. Carries no other system's token (the `pondSwapMemory` hazard):
 *  a memory that merely *looks* like grove news gets re-spread by the cascade rung that owns that token. */
export function yearnMemory(zoneName: string): string {
  return `${YEARN_MARK}${zoneName} in a while`;
}

/** The bubble the dino floats as it sets off for the ground it misses. */
export function yearnLine(): string {
  return '💭';
}

/** The ticker line — a departure with a reason that isn't hunger. */
export function yearnEvent(name: string, zoneName: string): string {
  return `💭 ${name} misses ${zoneName} — heads back`;
}

/**
 * The ground a dino is currently longing for, read off its own memory ring — the `taughtCount` /
 * `foodwebStanding` precedent: a standing is what a dino *remembers*, not a second persisted tally. The
 * **most recent** matching memory wins, so the book tracks the current longing rather than an outgrown one.
 */
export function yearnedFor(memories: readonly string[]): string | null {
  for (let i = memories.length - 1; i >= 0; i--) {
    const m = memories[i];
    if (!m.startsWith(YEARN_MARK)) continue;
    const rest = m.slice(YEARN_MARK.length);
    const zoneName = rest.endsWith(' in a while') ? rest.slice(0, -' in a while'.length) : rest;
    if (zoneName) return zoneName;
  }
  return null;
}

/** The longing as it reads in the collection book. */
export function yearnBookLine(zoneName: string): string {
  return `misses ${zoneName}`;
}
