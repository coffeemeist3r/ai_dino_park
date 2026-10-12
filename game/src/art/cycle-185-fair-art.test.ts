import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { FAIR_ART_KEY } from '../world/festival';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-601 — the fair basket at the pond (host 599). */
describe('cycle 185-art — the fair basket', () => {
  const rig = PROP_RIGS[FAIR_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, on the family rim, and placed', () => {
    expect(rig).toBeDefined();
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(rig.palette.o).toBe(PROP_RIGS.welcome.palette.o);
    expect(worldPlacedProps().has(FAIR_ART_KEY)).toBe(true);
  });
  it('carries all four traded goods', () => {
    const inked = rig.grid.join('');
    for (const c of ['s', 'g', 'n', 'f']) expect(inked).toContain(c);
  });
});
