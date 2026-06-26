/**
 * Plantable plot (BACKLOG-145) — the build arc's growing half.
 *
 * The bowl has gathered (146) → stockpiled (285) → crafted (286), but it grows nothing the cast eats —
 * food only ever falls from the keeper's hatch. This is the Stardew-flavoured counterpart: the keeper
 * plants one plot, a crop grows over realtime-clock days (105) through visible stages, and harvesting
 * releases the crop back into the existing food set so it feeds the hatch/favorites loop (059/061).
 *
 * Pure TypeScript (no Phaser): the stage math + adjacency live here and are unit-tested; WorldScene owns
 * the P-key handler, the marker sprite, the harvest drop (reusing the feeding spine), and persistence.
 * One plot, one crop — multiple plots/crops, watering, and withering stay deferred.
 */

import type { Tile } from './movement';
import { BOWL_ID, GROVE_ID } from './zones';

export type CropStage = 'seed' | 'sprout' | 'ripe';

export const STAGE_GLYPH: Record<CropStage | 'empty', string> = {
  empty: '🟫',
  seed: '🌱',
  sprout: '🌿',
  ripe: '🍓',
};

/** The crop is an existing food (foods.ts) — harvested "into the existing food set". */
export const CROP_FOOD_ID = 'berries';

/** In-game days since planting at which the crop advances. Realtime-clock days (WorldClock.now().day). */
export const SPROUT_DAY = 1;
export const RIPE_DAY = 2;

/** The bowl's fixed plot tile — bottom-left, clear of the den ({10,11}), the feeding row, and centre. */
export const PLOT_TILE: Tile = { tileX: 2, tileY: 12 };

/**
 * The grove's plot tile (BACKLOG-349) — grove grass, clear of the path band (rows 6–7) and the NE pond
 * (x 15–18 / y 2–4) and the edges, so the second zone farms its own crop. The plot is now per-zone.
 */
export const GROVE_PLOT_TILE: Tile = { tileX: 4, tileY: 10 };

/** Each zone's fixed plot tile (BACKLOG-308/349 — zone-scoped). A zone absent here has no plot. */
export const PLOT_TILE_BY_ZONE: Record<string, Tile> = {
  [BOWL_ID]: PLOT_TILE,
  [GROVE_ID]: GROVE_PLOT_TILE,
};

/** The crop's stage given whole in-game days since it was planted. Negative gaps clamp to seed. */
export function cropStage(daysElapsed: number): CropStage {
  if (daysElapsed >= RIPE_DAY) return 'ripe';
  if (daysElapsed >= SPROUT_DAY) return 'sprout';
  return 'seed';
}

/** Is the keeper close enough to work the plot — same tile or one away (Chebyshev ≤ 1)? */
export function plotAdjacent(keeper: Tile, plot: Tile): boolean {
  return Math.abs(keeper.tileX - plot.tileX) <= 1 && Math.abs(keeper.tileY - plot.tileY) <= 1;
}
