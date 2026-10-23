import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { NEST_ART_KEY } from '../social/courtship';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-623 — the pair's nest (host 622). */
describe('cycle 194-art — the nest', () => {
  const rig = PROP_RIGS[NEST_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, and placed', () => {
    expect(rig).toBeDefined();
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(worldPlacedProps().has(NEST_ART_KEY)).toBe(true);
  });
  it('is low and wide, with a hollow, and shares the egg’s outline and ground', () => {
    expect(rig.grid.slice(0, 7).join('')).toMatch(/^\.+$/);
    expect(rig.grid[10]).toMatch(/^o.*o$/);
    expect(rig.grid.join('')).toContain('ddddd');
    expect(rig.palette.o).toBe(PROP_RIGS.egg.palette.o);
    expect(rig.palette.s).toBe(PROP_RIGS.egg.palette.s);
  });
});
