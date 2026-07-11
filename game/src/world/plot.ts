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
import { BOWL_ID, GROVE_ID, FERNREACH_ID } from './zones';

export type CropStage = 'seed' | 'sprout' | 'ripe';

export const STAGE_GLYPH: Record<CropStage | 'empty', string> = {
  empty: '🟫',
  seed: '🌱',
  sprout: '🌿',
  ripe: '🍓',
};

/** The crop is an existing food (foods.ts) — harvested "into the existing food set". Bowl default. */
export const CROP_FOOD_ID = 'berries';

/**
 * Per-zone crop identity (BACKLOG-418) — each zone's plot grows a crop suited to it, so the *farming* half
 * of the economy reads as separate places the way gathering already diverges per zone (348) and the three
 * skylines do (417). The bowl keeps its sweet berries (byte-identical); the shaded grove grows leafy greens.
 * `ripe` is the marker the ripe plot shows — deliberately distinct from the 🌿 *sprout* glyph AND the greens
 * food's own 🌿 (so a grove plot never reads ambiguously). A zone with no entry falls back to the bowl berry.
 */
export interface ZoneCrop {
  food: string; // a FOODS id — harvest releases this into the feeding loop
  ripe: string; // the ripe-stage marker glyph
}

export const CROP_BY_ZONE: Record<string, ZoneCrop> = {
  [BOWL_ID]: { food: CROP_FOOD_ID, ripe: '🍓' },
  [GROVE_ID]: { food: 'greens', ripe: '🥬' },
  // BACKLOG-432: the Fernreach farms starchy roots — the third zone's own crop, completing the farming
  // divergence. The 🍠 ripe marker is distinct from the sprout 🌿, the roots food's own 🥕, and 🍓/🥬.
  [FERNREACH_ID]: { food: 'roots', ripe: '🍠' },
};

/** The crop a zone's plot grows (BACKLOG-418) — its own entry, or the bowl berry as fallback. */
export function cropOf(zone: string): ZoneCrop {
  return CROP_BY_ZONE[zone] ?? CROP_BY_ZONE[BOWL_ID];
}

/** A plot marker glyph for a stage: the ripe stage reads the zone's *own* crop, the rest share STAGE_GLYPH. */
export function stageGlyph(zone: string, stage: CropStage | 'empty'): string {
  return stage === 'ripe' ? cropOf(zone).ripe : STAGE_GLYPH[stage];
}

/**
 * The PROP_RIGS key for a crop's *ripe* pixel rig (BACKLOG-434) — the berry keeps the original `crop_ripe`
 * (byte-identical bowl), every other crop reads `crop_ripe_<food>` (the grove's greens → `crop_ripe_greens`,
 * the rig stashed cycle 95). `drawPlotSprite` bakes this where the rig exists, else falls back to the glyph —
 * so a crop with no rig yet still reads as its own marker.
 */
export function ripeRigKey(food: string): string {
  return food === CROP_FOOD_ID ? 'crop_ripe' : `crop_ripe_${food}`;
}

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

/**
 * The Fernreach's plot tile (BACKLOG-432) — Fernreach grass, clear of the west creek (x 3–4), the
 * southern + NE fern bands, and the edges (see `fernreachTileAt`), so the third zone farms its own crop.
 */
export const FERNREACH_PLOT_TILE: Tile = { tileX: 8, tileY: 8 };

/** Each zone's fixed plot tile (BACKLOG-308/349/432 — zone-scoped). A zone absent here has no plot. */
export const PLOT_TILE_BY_ZONE: Record<string, Tile> = {
  [BOWL_ID]: PLOT_TILE,
  [GROVE_ID]: GROVE_PLOT_TILE,
  [FERNREACH_ID]: FERNREACH_PLOT_TILE,
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
