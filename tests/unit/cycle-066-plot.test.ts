import { describe, it, expect } from 'vitest';
import {
  cropStage,
  plotAdjacent,
  STAGE_GLYPH,
  CROP_FOOD_ID,
  SPROUT_DAY,
  RIPE_DAY,
  PLOT_TILE,
} from '../../game/src/world/plot';
import { FOODS } from '../../game/src/world/foods';

describe('plantable plot (BACKLOG-145)', () => {
  it('grows seed → sprout → ripe at the day thresholds', () => {
    expect(cropStage(0)).toBe('seed');
    expect(cropStage(SPROUT_DAY)).toBe('sprout');
    expect(cropStage(RIPE_DAY)).toBe('ripe');
    expect(cropStage(RIPE_DAY + 5)).toBe('ripe');
  });

  it('clamps a negative gap (clock moved back) to seed', () => {
    expect(cropStage(-3)).toBe('seed');
  });

  it('is adjacent within one tile (Chebyshev ≤ 1), not at distance 2', () => {
    expect(plotAdjacent(PLOT_TILE, PLOT_TILE)).toBe(true);
    expect(plotAdjacent({ tileX: PLOT_TILE.tileX + 1, tileY: PLOT_TILE.tileY + 1 }, PLOT_TILE)).toBe(true);
    expect(plotAdjacent({ tileX: PLOT_TILE.tileX + 2, tileY: PLOT_TILE.tileY }, PLOT_TILE)).toBe(false);
  });

  it('has a glyph for every stage and an empty plot', () => {
    for (const s of ['empty', 'seed', 'sprout', 'ripe'] as const) expect(STAGE_GLYPH[s]).toBeTruthy();
  });

  it('the crop is a real existing food (harvests into the food set)', () => {
    expect(FOODS.some((f) => f.id === CROP_FOOD_ID)).toBe(true);
  });
});
