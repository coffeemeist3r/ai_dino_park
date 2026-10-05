import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { SEEK_ART_KEY } from '../ai/companion';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-584 — eyes with somewhere to be, over a dino setting off to find someone. */
describe('cycle 178-art — seek', () => {
  const rig = PROP_RIGS[SEEK_ART_KEY];
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
    expect(worldPlacedProps().has(SEEK_ART_KEY)).toBe(true);
  });
  it('looks somewhere: no sclera right of the pupils, and the speed ticks trail on the left', () => {
    for (const row of rig.grid) {
      const pupil = row.indexOf('woo');
      if (pupil >= 0) expect(row.slice(pupil + 1, pupil + 4)).toBe('ooo');
    }
    const ticks = rig.grid.map((r) => r.indexOf('y')).filter((i) => i >= 0);
    expect(ticks.length).toBeGreaterThan(0);
    for (const i of ticks) expect(i).toBeLessThan(3);
  });
});
