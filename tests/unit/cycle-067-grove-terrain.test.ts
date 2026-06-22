import { describe, it, expect } from 'vitest';
import { groveTileAt, GROVE_TINT, type TileKind } from '../../game/src/world/zones';

/**
 * Grove terrain (BACKLOG-294) — the grove gets its own ground layout so the second zone reads as a
 * place, not cloned bowl grass. Pure layout test (the render lives in bake.ts / WorldScene): the
 * sub-regions land where expected and the layout actually contains each kind.
 */

const COLS = 20;
const ROWS = 15;

describe('groveTileAt (BACKLOG-294)', () => {
  it('puts water in the north-east pond block', () => {
    expect(groveTileAt(COLS - 3, 3, COLS, ROWS)).toBe('water');
  });

  it('puts a path band across the vertical middle', () => {
    const mid = Math.floor(ROWS / 2);
    expect(groveTileAt(1, mid, COLS, ROWS)).toBe('path');
    expect(groveTileAt(COLS - 1, mid - 1, COLS, ROWS)).toBe('path');
  });

  it('is grass away from the path and pond', () => {
    expect(groveTileAt(1, 1, COLS, ROWS)).toBe('grass'); // top-left corner
    expect(groveTileAt(1, ROWS - 1, COLS, ROWS)).toBe('grass'); // bottom-left corner
  });

  it('contains at least one tile of each sub-region and only valid kinds', () => {
    const counts: Record<TileKind, number> = { grass: 0, path: 0, water: 0 };
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const k = groveTileAt(x, y, COLS, ROWS);
        expect(['grass', 'path', 'water']).toContain(k);
        counts[k]++;
      }
    }
    expect(counts.path).toBeGreaterThan(0);
    expect(counts.water).toBeGreaterThan(0);
    expect(counts.grass).toBeGreaterThan(0);
  });

  it('exposes a non-neutral grove tint so the floor reads distinct', () => {
    expect(GROVE_TINT).not.toBe(0xffffff);
  });
});
