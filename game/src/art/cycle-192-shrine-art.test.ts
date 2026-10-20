import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { FAITH_ART_KEY, SHRINE_ART_KEY } from '../world/faith';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-617 — the shrine the faithful raise at the sermon spot (host 614). */
describe('cycle 192-art — the shrine', () => {
  const rig = PROP_RIGS[SHRINE_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, on the family rim, and placed', () => {
    expect(rig).toBeDefined();
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(rig.palette.o).toBe(PROP_RIGS.welcome.palette.o);
    expect(worldPlacedProps().has(SHRINE_ART_KEY)).toBe(true);
  });
  it('is the singing stone built up: same moss and cut, wider, still low', () => {
    const stone = PROP_RIGS[FAITH_ART_KEY];
    expect(rig.palette.m).toBe(stone.palette.m);
    expect(rig.palette.c).toBe(stone.palette.c);
    expect(rig.grid).not.toEqual(stone.grid);
    const inked = rig.grid.map((r, y) => (/[^.]/.test(r) ? y : -1)).filter((y) => y >= 0);
    expect(Math.min(...inked)).toBeGreaterThanOrEqual(4);
    expect(rig.grid.some((r) => /^o[^.]{14}o$/.test(r))).toBe(true); // the slab spans the tile
  });
});
