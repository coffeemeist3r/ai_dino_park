import { describe, it, expect } from 'vitest';
import { PATH_RIG, WATER_RIG, TILE_RIGS, baseChar, type TileRig } from '../../game/src/art/tileArt';

/**
 * Path + water ground tiles (BACKLOG-033, the grove's sub-regions from -294). The grove terrain (294)
 * defines where these land; here the Artist's rigs get the same Node discipline as grass: 16×16,
 * GBA palette, opaque, two distinct variants, and seamless flat-base borders so each tiles among itself.
 */

const charsOf = (frame: ReadonlyArray<string>): Set<string> => {
  const out = new Set<string>();
  for (const row of frame) for (const ch of row) out.add(ch);
  return out;
};

const borderIsBase = (rig: TileRig, grid: ReadonlyArray<string>): boolean => {
  const base = baseChar(rig);
  const top = grid[0];
  const bottom = grid[grid.length - 1];
  if ([...top].some((c) => c !== base) || [...bottom].some((c) => c !== base)) return false;
  return grid.every((row) => row[0] === base && row[row.length - 1] === base);
};

describe.each([
  ['path', PATH_RIG],
  ['water', WATER_RIG],
])('%s tile rig (BACKLOG-033)', (name, rig) => {
  it('is a 16×16 grid in every variant', () => {
    expect(rig.size).toBe(16);
    for (const grid of rig.variants) {
      expect(grid).toHaveLength(16);
      for (const row of grid) expect(row).toHaveLength(16);
    }
  });

  it('keeps GBA palette discipline — ≤ 8 colours, every char defined', () => {
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    for (const grid of rig.variants) for (const ch of charsOf(grid)) expect(rig.palette[ch]).toBeDefined();
  });

  it('is opaque ground — no transparency', () => {
    for (const grid of rig.variants) expect(charsOf(grid).has('.')).toBe(false);
  });

  it('has two distinct variants', () => {
    expect(rig.variants.length).toBe(2);
    expect(rig.variants[0]).not.toEqual(rig.variants[1]);
  });

  it('mostly base colour — detail is a sparse scatter, not a mosaic', () => {
    const base = baseChar(rig);
    for (const grid of rig.variants) {
      const flat = grid.join('').split('').filter((c) => c === base).length;
      expect(flat).toBeGreaterThan((16 * 16) / 2);
    }
  });

  it('has a flat base border in every variant — tiles abut with no seam', () => {
    for (const grid of rig.variants) expect(borderIsBase(rig, grid)).toBe(true);
  });

  it(`is registered in TILE_RIGS as ${name}`, () => {
    expect(TILE_RIGS[name]).toBe(rig);
  });
});
