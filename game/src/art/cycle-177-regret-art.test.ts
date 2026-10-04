import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { REGRET_ART_KEY } from '../world/pecking';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-580 — the bead of sweat over a gobbler that has just shoved past a friend. */
describe('cycle 177-art — regret', () => {
  const rig = PROP_RIGS[REGRET_ART_KEY];
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
    expect(worldPlacedProps().has(REGRET_ART_KEY)).toBe(true);
  });
  it('beads at the top and hangs heavy at the bottom', () => {
    const width = (row: string) => row.replace(/\./g, '').length;
    expect(width(rig.grid[1])).toBeLessThan(width(rig.grid[10]));
  });
  it('is lit upper left and shaded lower right', () => {
    const g = rig.grid;
    const count = (rows: readonly string[], c: string) => rows.join('').split(c).length - 1;
    expect(count(g.slice(0, 10), 'h')).toBeGreaterThan(0);
    expect(count(g.slice(10), 'h')).toBe(0);
    expect(count(g.slice(0, 9), 'b')).toBe(0);
  });
});
