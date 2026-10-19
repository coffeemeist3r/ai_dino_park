import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { FAITH_ART_KEY } from '../world/faith';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-616 — the faith's stone by the pond (host 613). */
describe('cycle 191-art — the faith stone', () => {
  const rig = PROP_RIGS[FAITH_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, on the family rim, and placed', () => {
    expect(rig).toBeDefined();
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(rig.palette.o).toBe(PROP_RIGS.welcome.palette.o);
    expect(worldPlacedProps().has(FAITH_ART_KEY)).toBe(true);
  });
  it('sits low — a boulder, not a standing stone — and carries the cut mark', () => {
    const inked = rig.grid.map((r, y) => (/[^.]/.test(r) ? y : -1)).filter((y) => y >= 0);
    expect(Math.min(...inked)).toBeGreaterThanOrEqual(5);
    expect(rig.grid.join('').split('c').length - 1).toBeGreaterThanOrEqual(6);
  });
});
