import { describe, it, expect } from 'vitest';
import { GRASS_RIG, TILE_RIGS, baseChar, type TileRig } from '../../game/src/art/tileArt';

/**
 * Ground tiles (BACKLOG-033) — Gen3 pixel grass authored as code. The render lives in bake.ts
 * (Phaser); here we Node-test the rig: dimensions, palette discipline, opacity, the variants
 * actually differ, and the SEAMLESS guarantee — every border is the flat base, so any tile abuts
 * any other with no seam.
 */

const charsOf = (frame: ReadonlyArray<string>): Set<string> => {
  const out = new Set<string>();
  for (const row of frame) for (const ch of row) out.add(ch);
  return out;
};

describe('grass tile rig (BACKLOG-033)', () => {
  it('is a 16×16 grid in every variant', () => {
    expect(GRASS_RIG.size).toBe(16);
    for (const grid of GRASS_RIG.variants) {
      expect(grid).toHaveLength(16);
      for (const row of grid) expect(row).toHaveLength(16);
    }
  });

  it('keeps GBA palette discipline — ≤ 15 colours, every char defined', () => {
    expect(Object.keys(GRASS_RIG.palette).length).toBeLessThanOrEqual(15);
    for (const grid of GRASS_RIG.variants) {
      for (const ch of charsOf(grid)) expect(GRASS_RIG.palette[ch]).toBeDefined();
    }
  });

  it('is opaque ground — no transparency', () => {
    for (const grid of GRASS_RIG.variants) expect(charsOf(grid).has('.')).toBe(false);
  });

  it('has two distinct variants so the checker reads alive', () => {
    expect(GRASS_RIG.variants.length).toBe(2);
    expect(GRASS_RIG.variants[0]).not.toEqual(GRASS_RIG.variants[1]);
  });

  it('tufts sit on the base — most pixels are the flat field green', () => {
    const base = baseChar(GRASS_RIG);
    for (const grid of GRASS_RIG.variants) {
      const flat = grid.join('').split('').filter((c) => c === base).length;
      expect(flat).toBeGreaterThan((16 * 16) / 2); // a field, not a thicket
    }
  });
});

describe('seamless guarantee', () => {
  const borderIsBase = (rig: TileRig, grid: ReadonlyArray<string>): boolean => {
    const base = baseChar(rig);
    const top = grid[0];
    const bottom = grid[grid.length - 1];
    if ([...top].some((c) => c !== base) || [...bottom].some((c) => c !== base)) return false;
    return grid.every((row) => row[0] === base && row[row.length - 1] === base);
  };

  it('every grass variant has a flat base border — tiles abut with no seam, in any arrangement', () => {
    for (const grid of GRASS_RIG.variants) expect(borderIsBase(GRASS_RIG, grid)).toBe(true);
  });

  it('grass is the registered ground tile', () => {
    expect(TILE_RIGS.grass).toBe(GRASS_RIG);
  });
});
