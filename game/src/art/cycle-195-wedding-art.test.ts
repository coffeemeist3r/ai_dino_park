import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { WEDDING_ART_KEY } from '../social/wedding';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-626 — the wedding mark (host 625). */
describe('cycle 195-art — the wedding mark', () => {
  const rig = PROP_RIGS[WEDDING_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, and placed', () => {
    expect(rig).toBeDefined();
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(worldPlacedProps().has(WEDDING_ART_KEY)).toBe(true);
  });
  it('is an arch open at the bottom, standing on the egg’s ground', () => {
    for (const row of rig.grid.slice(4, 14)) expect(row.slice(6, 10)).toBe('....');
    expect(rig.palette.o).toBe(PROP_RIGS.egg.palette.o);
    expect(rig.palette.s).toBe(PROP_RIGS.egg.palette.s);
  });
});
