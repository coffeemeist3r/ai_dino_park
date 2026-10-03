import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { ADMIRE_ART_KEY } from '../world/pecking';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-579 — the gold star over a friend who saw a dino stand up at the hatch. */
describe('cycle 176-art — admire', () => {
  const rig = PROP_RIGS[ADMIRE_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, on the family rim', () => {
    expect(rig).toBeDefined();
    expect(rig.size).toBe(16);
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(rig.palette.o).toBe(PROP_RIGS[ROUSE_ART_KEY].palette.o);
  });
  it('is placed by the shipping world', () => {
    expect(worldPlacedProps().has(ADMIRE_ART_KEY)).toBe(true);
  });
  it('is lit upper left and shaded lower right', () => {
    const g = rig.grid;
    const count = (rows: readonly string[], c: string) => rows.join('').split(c).length - 1;
    expect(count(g.slice(0, 8), 'h')).toBeGreaterThan(0);
    expect(count(g.slice(8), 'h')).toBe(0);
    expect(count(g.slice(0, 8), 'y')).toBe(0);
  });
});
