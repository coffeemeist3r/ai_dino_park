import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { MOLT_ART_KEY } from '../world/molt';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-603 — the shed skin (host 023). */
describe('cycle 187-art — the shed skin', () => {
  const rig = PROP_RIGS[MOLT_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, on the family rim, and placed', () => {
    expect(rig).toBeDefined();
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(rig.palette.o).toBe(PROP_RIGS.welcome.palette.o);
    expect(worldPlacedProps().has(MOLT_ART_KEY)).toBe(true);
  });
  it('is open along the back: the inside shows through the husk', () => {
    expect(rig.grid.join('')).toContain('s');
    expect(rig.grid[8]).toMatch(/o\.\.\.o/);
  });
});
