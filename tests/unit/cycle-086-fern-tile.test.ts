import { describe, it, expect } from 'vitest';
import { FERN_RIG, GRASS_RIG, TILE_RIGS, baseChar, type TileRig } from '../../game/src/art/tileArt';

/**
 * Fern scrub ground tile (BACKLOG-399 layout, drawn cycle 086-art) — The Fernreach's bracken floor, the
 * first renderable terrain art since the grove's path/water (033). Same Node discipline as every tile rig:
 * 16×16, GBA palette, opaque, two distinct variants, seamless flat-base borders — plus it must read as its
 * own ground, not grass.
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

describe('fern tile rig (BACKLOG-399)', () => {
  it('is a 16×16 grid in every variant', () => {
    expect(FERN_RIG.size).toBe(16);
    for (const grid of FERN_RIG.variants) {
      expect(grid).toHaveLength(16);
      for (const row of grid) expect(row).toHaveLength(16);
    }
  });

  it('keeps GBA palette discipline — ≤ 8 colours, every char defined', () => {
    expect(Object.keys(FERN_RIG.palette).length).toBeLessThanOrEqual(8);
    for (const grid of FERN_RIG.variants) for (const ch of charsOf(grid)) expect(FERN_RIG.palette[ch]).toBeDefined();
  });

  it('is opaque ground — no transparency', () => {
    for (const grid of FERN_RIG.variants) expect(charsOf(grid).has('.')).toBe(false);
  });

  it('has two distinct variants', () => {
    expect(FERN_RIG.variants.length).toBe(2);
    expect(FERN_RIG.variants[0]).not.toEqual(FERN_RIG.variants[1]);
  });

  it('mostly base colour — fronds are a sparse scatter, not a mosaic', () => {
    const base = baseChar(FERN_RIG);
    for (const grid of FERN_RIG.variants) {
      const flat = grid.join('').split('').filter((c) => c === base).length;
      expect(flat).toBeGreaterThan((16 * 16) / 2);
    }
  });

  it('has a flat base border in every variant — scrub tiles abut with no seam', () => {
    for (const grid of FERN_RIG.variants) expect(borderIsBase(FERN_RIG, grid)).toBe(true);
  });

  it('reads as its own ground, not grass (distinct base colour)', () => {
    expect(FERN_RIG.palette.f).not.toBe(GRASS_RIG.palette.g);
  });

  it('is registered in TILE_RIGS as fern', () => {
    expect(TILE_RIGS.fern).toBe(FERN_RIG);
  });
});
