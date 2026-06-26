/**
 * First steps in the grove (BACKLOG-339) — arrival becomes a beat. The visible crossing (334) drops a
 * migrant at the far zone's edge with no reaction; this gives the *first* time a dino ever crosses into
 * the grove a moment of its own: it pauses to look around (🌿) and files a "first time across" memory
 * that can surface in a later greeting, before wandering on. Fires once per dino, ever.
 *
 * Pure TypeScript (no Phaser, no AI backend — the `NPCBrain` boundary stays intact): Node-testable.
 * WorldScene owns the bubble, the one-step pause, the persisted visited-set, and the save.
 */

import { GROVE_ID, groveTileAt } from './zones';

/** A dino's first-ever arrival in the grove (so the look-around beat fires): crossing *into* the grove,
 *  and not somewhere it's already been. Crossing back to the bowl, or a return trip, is silent. */
export function firstGroveArrival(visited: readonly string[], name: string, destZone: string): boolean {
  return destZone === GROVE_ID && !visited.includes(name);
}

/** The memory a dino files the first time it crosses into the grove (rides the existing memory store). */
export function groveArrivalMemory(): string {
  return '🌿 first time across — the grove';
}

/** The look-around bubble floated on that first arrival. */
export function groveArrivalLine(): string {
  return '🌿 …somewhere new…';
}

/**
 * First sight of the pond (BACKLOG-359) — a *separate* beat from the grove-entry one above. A migrant
 * enters the grove at its west edge (where 339 fires); the pond sits across the clearing in the NE, so
 * a dino has to wander to it. The first time it comes within sight of the water — the place every grove
 * rumor (342/345/355) was about — it stops wide-eyed. Once per dino ever, gated by its own `pondSeen`
 * set (never `groveVisited`), so this never collapses into 339.
 */

/** How close (Chebyshev tiles) counts as "within sight of" the pond water. */
export const POND_SIGHT_RADIUS = 2;

/** Is `tile` within POND_SIGHT_RADIUS of any grove water tile? Scans the small neighbourhood over the
 *  existing 294 terrain map; pure, in-bounds only. */
export function nearPond(tile: { tileX: number; tileY: number }, cols: number, rows: number): boolean {
  for (let dy = -POND_SIGHT_RADIUS; dy <= POND_SIGHT_RADIUS; dy++) {
    for (let dx = -POND_SIGHT_RADIUS; dx <= POND_SIGHT_RADIUS; dx++) {
      const x = tile.tileX + dx;
      const y = tile.tileY + dy;
      if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
      if (groveTileAt(x, y, cols, rows) === 'water') return true;
    }
  }
  return false;
}

/** Should the pond-sight beat fire for this dino now: it lives in the grove, hasn't seen the pond yet,
 *  and is within sight of the water. */
export function firstPondSight(
  pondSeen: readonly string[],
  name: string,
  zone: string,
  tile: { tileX: number; tileY: number },
  cols: number,
  rows: number,
): boolean {
  return zone === GROVE_ID && !pondSeen.includes(name) && nearPond(tile, cols, rows);
}

/** The memory a dino files the first time it sees the pond (rides the existing memory store). */
export function pondSightMemory(): string {
  return '💧 first saw the pond';
}

/** The wide-eyed bubble floated on that first sight. */
export function pondSightLine(): string {
  return '💧 …the pond…';
}
