/**
 * The loner (BACKLOG-135) — the dino on the outside of the bond graph.
 *
 * The dino↔dino bond graph (013) has driven huddles, comfort, and gossip for cycles, but it never
 * said anything about a dino with *no* close ties. This reads that gap: a dino whose strongest pairwise
 * bond sits below a floor is a **loner** — it withdraws to the bowl edge and mopes (🥀), and a keeper
 * greet lands extra-hard on the one who needs it most. Poor social integration made a visible tell.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable. The loner read is a pure function of the bond
 * map; WorldScene owns the edge-drift, the 🥀 mark, and the outsized greet bump.
 */

import { bondPoints, type Bonds } from '../social/bonds';
import type { Tile } from './movement';

/** A dino is a loner when its strongest bond is below this — one huddle's worth (the comfort floor's scale). */
export const LONER_FLOOR = 8;

/** Extra affinity a greet/tone to a loner earns — the lonely dino is extra-responsive to the keeper's notice. */
export const LONER_BONUS = 4;

/** The floating mark over a moping loner. */
export const MOPE_GLYPH = '🥀';

/**
 * Fraction of steps a loner spends withdrawing to the edge (vs wandering normally). Deliberately < 1 so
 * a loner still mills enough to *meet* a dino and grow a bond — otherwise an all-unbonded fresh bowl would
 * deadlock with every dino pinned to a wall, never meeting, never lifting out of loner status. The 🥀
 * tell rides loner status itself, not this roll, so it shows the whole time regardless.
 */
export const MOPE_CHANCE = 0.5;

/**
 * Is `name` a loner — every pairwise bond to a peer below `floor` (so its strongest bond is too weak to
 * pull it into the den)? A dino with no peers is a loner by default (nobody to be close to).
 */
export function isLoner(bonds: Bonds, name: string, peers: readonly string[], floor = LONER_FLOOR): boolean {
  for (const other of peers) {
    if (other === name) continue;
    if (bondPoints(bonds, name, other) >= floor) return false;
  }
  return true;
}

/** The nearest bowl-edge tile a moping loner withdraws toward (the closest of the four walls). */
export function edgeTarget(tile: Tile, cols: number, rows: number): Tile {
  const dists = [tile.tileX, cols - 1 - tile.tileX, tile.tileY, rows - 1 - tile.tileY];
  const min = Math.min(...dists);
  if (min === dists[0]) return { tileX: 0, tileY: tile.tileY };
  if (min === dists[1]) return { tileX: cols - 1, tileY: tile.tileY };
  if (min === dists[2]) return { tileX: tile.tileX, tileY: 0 };
  return { tileX: tile.tileX, tileY: rows - 1 };
}

/** The one-shot beat floated when the keeper's notice lifts a loner. */
export function perkUpLine(name: string): string {
  return `${name} perks up 💐`;
}

/** The mark floated when a loner grows its first real friend (BACKLOG-369). */
export const FOUND_FRIEND_GLYPH = '🌱';

/**
 * Did `name` just stop being a loner (BACKLOG-369) — a loner under `before`, no longer one under `after`?
 * Pure read over two bond snapshots: the first time a friendless dino's bond clears the floor, this is the
 * transition to mark. (The 🥀 lifts on its own off the live graph; this is what makes the moment a *beat*.)
 */
export function liftsLoner(
  before: Bonds,
  after: Bonds,
  name: string,
  peers: readonly string[],
  floor = LONER_FLOOR,
): boolean {
  return isLoner(before, name, peers, floor) && !isLoner(after, name, peers, floor);
}

/** The memory a dino files when it grows out of loneliness (BACKLOG-369). */
export function foundFriendMemory(): string {
  return 'found a friend — not so alone now';
}

/** The one-shot perk-up bubble floated over a dino that just found its first friend (BACKLOG-369). */
export function foundFriendLine(name: string): string {
  return `${name} ${FOUND_FRIEND_GLYPH}`;
}

/** The mark floated when a moping loner is soothed by its favorite food (BACKLOG-374). */
export const COMFORT_FOOD_GLYPH = '😌';

/**
 * Does a meal comfort a moping dino (BACKLOG-374) — only when it's the dino's *favorite* food AND the dino
 * is currently a loner? A plain meal, or a favorite eaten by a well-bonded dino, is just food. Solace is
 * per-palate: who is soothed by what becomes a per-dino tell. Pure.
 */
export function comfortsLoner(favorite: boolean, lonerNow: boolean): boolean {
  return favorite && lonerNow;
}

/** The memory a loner files when its favorite eased the ache (BACKLOG-374) — distinct from a plain favorite. */
export function comfortFoodMemory(label: string): string {
  return `comfort food — the ${label} eased the ache ${COMFORT_FOOD_GLYPH}`;
}

/** The one-shot solace bubble floated over a comforted loner (BACKLOG-374). */
export function comfortFoodLine(name: string): string {
  return `${name} ${COMFORT_FOOD_GLYPH}`;
}
