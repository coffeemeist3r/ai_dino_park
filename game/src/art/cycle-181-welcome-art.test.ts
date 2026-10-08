import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { WELCOME_ART_KEY } from '../ai/welcome';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-593 — a sprig over each resident that answers a newcomer. */
describe('cycle 181-art — welcome', () => {
  const rig = PROP_RIGS[WELCOME_ART_KEY];
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
    expect(worldPlacedProps().has(WELCOME_ART_KEY)).toBe(true);
  });
  it('is a sprig: one stem from the bottom edge to the top leaf, leaves either side of it', () => {
    for (let r = 4; r <= 14; r++) expect(rig.grid[r].includes('g') || rig.grid[r].includes('l')).toBe(true); // unbroken
    const leafCols = rig.grid.flatMap((row) => [...row].map((c, i) => (c === 'l' ? i : -1)).filter((i) => i >= 0));
    expect(Math.min(...leafCols)).toBeLessThan(6); // a leaf to the left of the stem
    expect(Math.max(...leafCols)).toBeGreaterThan(9); // and one to the right
  });
});
