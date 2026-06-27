/**
 * Feeding hatch (BACKLOG-059) — the keeper drops food through the lid and the
 * cast swarms it. Pure (no Phaser): the reaction, the rush step, the landing tile,
 * and "did it reach the food" are all decided here and unit-tested; WorldScene
 * turns an H press into a food drop and drives the swarm off the world clock.
 *
 * Symmetric to world/startle.ts — a tap repels by temperament, food attracts by it.
 */

import type { Tile } from './movement';
import { stepToward } from './movement';

export type FeedReaction = 'rush' | 'ignore';

export const FEED_RANGE = 7; // tiles — beyond this a food drop goes unnoticed
export const FEED_RANGE_FAV = 12; // a dino will cross most of the bowl for its favorite (BACKLOG-061)
export const FEED_GAIN = 5; // friendship points a fed dino gains (keeping reframed)
export const FEED_GAIN_FAV = 9; // a favorite is extra-happy: > plain feed, < a loved gift (12)
const EAGER = 0.4; // energy at/above which a dino bothers to rush the food
const EAGER_FAV = 0.15; // even a fairly calm dino rouses for its favorite

/**
 * Does a dino notice and rush dropped food, given its energy (0..1) and distance?
 * Its favorite pulls harder — a wider range and a lower energy bar — so the keeper
 * learns tastes by watching who comes running for what (BACKLOG-061). Omitting
 * `isFavorite` keeps the cycle-25 behavior exactly.
 */
export function reactionToFood(energy: number, distTiles: number, isFavorite = false): FeedReaction {
  if (distTiles > (isFavorite ? FEED_RANGE_FAV : FEED_RANGE)) return 'ignore';
  return energy >= (isFavorite ? EAGER_FAV : EAGER) ? 'rush' : 'ignore';
}

/** One tile toward the food along the dominant axis, clamped. Reuses stepToward. */
export function feedStep(from: Tile, food: Tile, cols: number, rows: number): Tile {
  return stepToward(from, food, cols, rows);
}

/** Has the dino reached the food — same tile or one tile away (Chebyshev ≤ 1)? */
export function reachedFood(at: Tile, food: Tile): boolean {
  return Math.abs(at.tileX - food.tileX) <= 1 && Math.abs(at.tileY - food.tileY) <= 1;
}

/**
 * Generous feeder (BACKLOG-375) — the need-drive (371) reaches *between* dinos. When a well-fed dino
 * wins the rush to a drop while a hungrier high-bond friend is in the swarm beside it, it gives up the
 * meal and lets the friend eat first — the first generosity that costs the giver something (the
 * friendship gain it forgoes). Pure: WorldScene supplies the winner's hunger and the nearby swarm's
 * {name, hunger, bond}; this decides *who* (if anyone) the winner yields to.
 */
export const WELL_FED = 0.3; // hunger at/below which the winner doesn't need this meal itself
export const GENEROUS_BOND = 40; // bond at/above which a dino will yield a meal to that friend
export const HUNGRIER_BY = 0.25; // the friend must be at least this much hungrier to be worth yielding to
export const SWARM_RADIUS = 4; // tiles from the food — who counts as "beside" the winner in the swarm

/**
 * The friend the `winner` yields its meal to, or null when it eats itself. Null when the winner is
 * hungry (> WELL_FED) — it keeps its own food — or when no candidate clears both bars (bond ≥
 * GENEROUS_BOND AND at least HUNGRIER_BY hungrier). Otherwise the hungriest qualifying friend, ties
 * broken by the higher bond. Deterministic — a stable sort over the supplied order.
 */
export function yieldFoodTo(
  winner: string,
  winnerHunger: number,
  candidates: ReadonlyArray<{ name: string; hunger: number; bond: number }>,
): string | null {
  if (winnerHunger > WELL_FED) return null;
  const worthy = candidates
    .filter((c) => c.name !== winner && c.bond >= GENEROUS_BOND && c.hunger - winnerHunger >= HUNGRIER_BY)
    .sort((a, b) => b.hunger - a.hunger || b.bond - a.bond);
  return worthy[0]?.name ?? null;
}

/**
 * Where dropped food lands. `col` (the hatch column) is honored and clamped when
 * given; otherwise a column is picked from `rand`. It always settles in the
 * upper-middle feeding zone so it falls into the cast rather than onto the rim.
 */
export function foodLanding(cols: number, rows: number, col?: number, rand: () => number = Math.random): Tile {
  const tileX =
    col === undefined ? Math.floor(rand() * cols) : Math.max(0, Math.min(cols - 1, Math.round(col)));
  return { tileX, tileY: Math.floor(rows * 0.45) };
}
