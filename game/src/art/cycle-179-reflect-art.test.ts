import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { REFLECT_ART_KEY } from '../ai/reflection';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-587 — a thought rising off a dino at dusk. */
describe('cycle 179-art — reflect', () => {
  const rig = PROP_RIGS[REFLECT_ART_KEY];
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
    expect(worldPlacedProps().has(REFLECT_ART_KEY)).toBe(true);
  });
  it('is a thought, not a speech balloon: cloud upper right, beads trailing lower left', () => {
    const inked = (r: number) => [...rig.grid[r]].map((c, i) => (c !== '.' ? i : -1)).filter((i) => i >= 0);
    for (let r = 1; r <= 9; r++) expect(Math.max(...inked(r))).toBeGreaterThan(8);
    for (let r = 10; r < 16; r++) for (const i of inked(r)) expect(i).toBeLessThan(6);
    expect(rig.grid[1]).toMatch(/o\.o/); // a scalloped top
  });
});
