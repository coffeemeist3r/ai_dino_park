import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { ERRAND_ART_KEY } from '../ai/place';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-590 — a bindle over a dino setting off for another ground. */
describe('cycle 180-art — errand', () => {
  const rig = PROP_RIGS[ERRAND_ART_KEY];
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
    expect(worldPlacedProps().has(ERRAND_ART_KEY)).toBe(true);
  });
  it('is a bindle, not a compass: a stick from lower left to upper right, the bundle hanging off its tip', () => {
    const col = (r: number) => rig.grid[r].indexOf('b');
    for (let r = 2; r <= 11; r++) expect(col(r)).toBe(col(r - 1) - 1); // one unbroken 45° diagonal
    const cloth = rig.grid.flatMap((row, r) => [...row].map((c, i) => (c === 'r' ? [r, i] : null)).filter(Boolean)) as number[][];
    expect(cloth.every(([r, i]) => r <= 9 && i >= 9)).toBe(true); // all of it up and to the right
  });
});
