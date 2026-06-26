import { describe, it, expect } from 'vitest';
import {
  PLOT_TILE,
  GROVE_PLOT_TILE,
  PLOT_TILE_BY_ZONE,
  plotAdjacent,
} from '../../game/src/world/plot';
import { BOWL_ID, GROVE_ID, groveTileAt } from '../../game/src/world/zones';

const COLS = 20;
const ROWS = 15;

describe('grove plot (BACKLOG-349)', () => {
  it('the per-zone map points each zone at its own plot tile', () => {
    expect(PLOT_TILE_BY_ZONE[BOWL_ID]).toEqual(PLOT_TILE);
    expect(PLOT_TILE_BY_ZONE[GROVE_ID]).toEqual(GROVE_PLOT_TILE);
  });

  it('the grove plot is a distinct tile from the bowl plot', () => {
    expect(GROVE_PLOT_TILE).not.toEqual(PLOT_TILE);
  });

  it('the grove plot sits on grove grass — not the path band, not the NE pond', () => {
    expect(groveTileAt(GROVE_PLOT_TILE.tileX, GROVE_PLOT_TILE.tileY, COLS, ROWS)).toBe('grass');
  });

  it('the grove plot is inside the map, off the edges', () => {
    expect(GROVE_PLOT_TILE.tileX).toBeGreaterThan(0);
    expect(GROVE_PLOT_TILE.tileX).toBeLessThan(COLS - 1);
    expect(GROVE_PLOT_TILE.tileY).toBeGreaterThan(0);
    expect(GROVE_PLOT_TILE.tileY).toBeLessThan(ROWS - 1);
  });

  it('adjacency works against the grove tile the same way (Chebyshev ≤ 1)', () => {
    expect(plotAdjacent(GROVE_PLOT_TILE, GROVE_PLOT_TILE)).toBe(true);
    expect(
      plotAdjacent({ tileX: GROVE_PLOT_TILE.tileX + 2, tileY: GROVE_PLOT_TILE.tileY }, GROVE_PLOT_TILE),
    ).toBe(false);
  });
});
