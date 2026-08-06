/**
 * What a ground can hold (BACKLOG-476) — the first ceiling in a park that has only ever had a floor.
 *
 * Every migration pull this project has built points the same way. 450 sends mouths toward plenty, 460
 * hollows the ground they leave faster so the exodus gains momentum, 458 spreads word of the richest ground
 * ahead of the bodies, 362 calls them back to grounds they miss, and 475 just made all of that reach clear
 * across the chain instead of stopping at the next ground over. Five accelerative systems, and the only
 * brake among them is `ZONE_FLOOR` — a floor on the ground being *emptied*, never a ceiling on the ground
 * being *filled*. A rich ground can absorb the entire cast and nothing in the park can object.
 *
 * Capacity is **derived**, not tabled. `ZONE_TERRAIN` (449) already holds each ground's layout, so how much
 * open ground a zone has is a fact the park contains and has simply never asked for; a second per-zone
 * number to keep in sync with the first is the bug 449 was written to end. A fifth ground gets a capacity
 * the day it gets a terrain function.
 *
 * Pure TypeScript (no Phaser, no `Math.random()` — the BACKLOG-456 rule against randomness anywhere near a
 * migration decision): Node-testable. WorldScene computes each zone's capacity once and reads crowding live.
 */

import { zoneTileAt } from './zones';

/**
 * How much open ground one mouth needs. The calibration knob — tune here, never at a call site.
 *
 * 60 is chosen against the founding state, not against a feeling: five dinos spawn in the bowl, the bowl has
 * 294 grass tiles, and `ceil(294 / 60) = 5`. The park therefore boots **at** capacity and not over it, so
 * this whole system is dormant on a fresh save and every pinned migration spec is byte-identical. It bites
 * the first time the cast genuinely piles up — five into the Fernreach (capacity 4), or six anywhere else.
 */
export const TILES_PER_HEAD = 60;

/** How hard each surplus mouth divides a crowded ground's appeal down. */
export const CROWD_APPEAL_DAMP = 0.5;

/**
 * A crowded ground's settled resident resists the ambient wander at this rate (vs. `SETTLED_MIGRATE_DAMP`
 * 0.6): a ground with more mouths than it can hold keeps its people more weakly. The same lever 460 pulled
 * for a *declining* zone, at the same strength — a zone under either stress holds you about as loosely.
 */
export const CROWDED_MIGRATE_DAMP = 0.3;

/**
 * The tiles of `zoneId` a body can actually live on: **grass only**.
 *
 * Water is not standable; the grove's trail is trodden through and the Fernreach's and Hollow's scrub is
 * thicket. That choice is what gives the four grounds different capacities at all — counting every non-water
 * tile puts them within 6% of each other (294 / 288 / 278 / 290) and the feature comes out uniform, which is
 * a system that exists without saying anything. On grass they are 294 / 248 / 226 / 250.
 *
 * 0 for an unknown zone id (`zoneTileAt` returns null there), which `zoneCapacity` floors.
 */
export function livableTiles(zoneId: string, cols: number, rows: number): number {
  let n = 0;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (zoneTileAt(zoneId, x, y, cols, rows) === 'grass') n++;
    }
  }
  return n;
}

/**
 * How many mouths `zoneId` can hold. Floored at 1 so no ground is ever made uninhabitable by arithmetic —
 * an unknown zone, or a future one drawn as solid water, still takes its first resident rather than reading
 * crowded the moment anybody arrives.
 */
export function zoneCapacity(zoneId: string, cols: number, rows: number): number {
  return Math.max(1, Math.ceil(livableTiles(zoneId, cols, rows) / TILES_PER_HEAD));
}

/** More mouths than the ground can hold. Strictly `>`: a ground exactly at capacity is full, not crowded. */
export function isCrowded(heads: number, capacity: number): boolean {
  return heads > capacity;
}

/**
 * A crowded ground's appeal, damped once per surplus mouth. Returns `appeal` **unchanged** when not crowded
 * — an exact identity, because `zoneAppeal` is read by `poorestResidents` (*who leaves*) as well as by
 * `richestNeighbor` (*where do I go*), and an uncrowded ground drifting by a hair would move the who-leaves
 * pick on every roll for reasons that have nothing to do with crowding.
 *
 * Folded into the appeal *number* rather than stacked above it as a tier — deliberately the opposite of
 * 474's frontier call. The frontier bonus had to be a tier because its two readers wanted opposite signs (an
 * empty ground should attract arrivals but must not mark its residents as the poorest). Crowding's two
 * readers want the *same* sign: a crowded ground is honestly both a worse place to arrive at and a likelier
 * place to leave. When both readings agree, the honest home for the effect is the number.
 *
 * Monotonic in plenty at a fixed head count (the divisor reads neither prosperity nor food) and never
 * negative for a non-negative appeal.
 */
export function crowdedAppeal(appeal: number, heads: number, capacity: number): number {
  if (!isCrowded(heads, capacity)) return appeal;
  return appeal / (1 + (heads - capacity) * CROWD_APPEAL_DAMP);
}
