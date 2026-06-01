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
 * Where dropped food lands. `col` (the hatch column) is honored and clamped when
 * given; otherwise a column is picked from `rand`. It always settles in the
 * upper-middle feeding zone so it falls into the cast rather than onto the rim.
 */
export function foodLanding(cols: number, rows: number, col?: number, rand: () => number = Math.random): Tile {
  const tileX =
    col === undefined ? Math.floor(rand() * cols) : Math.max(0, Math.min(cols - 1, Math.round(col)));
  return { tileX, tileY: Math.floor(rows * 0.45) };
}
