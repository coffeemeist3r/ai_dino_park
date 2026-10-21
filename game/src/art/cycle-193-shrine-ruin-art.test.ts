import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { SHRINE_ART_KEY } from '../world/faith';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-619 — the lapsed shrine, drawn by the `<name>_derelict` convention (host: a derelict `faith.shrine`). */
describe('cycle 193-art — the lapsed shrine', () => {
  const rig = PROP_RIGS[`${SHRINE_ART_KEY}_derelict`];
  const shrine = PROP_RIGS[SHRINE_ART_KEY];
  it('is a square 16px grid whose palette is exactly what it inks, and placed', () => {
    expect(rig).toBeDefined();
    expect(rig.grid).toHaveLength(16);
    for (const row of rig.grid) expect(row).toHaveLength(16);
    expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
    expect(worldPlacedProps().has(`${SHRINE_ART_KEY}_derelict`)).toBe(true);
  });
  it('is the same stone, not a greyer one: the shrine’s own palette', () => {
    expect(rig.palette).toEqual(shrine.palette);
    expect(rig.grid).not.toEqual(shrine.grid);
  });
  it('the singing stone leans but stands; the hauled stones lie in the grass and the slab is split', () => {
    expect(rig.grid.slice(0, 9).join('')).toContain('ohcsscdo'); // the cut spiral, upright
    expect(rig.grid.some((r) => /^o[^.]{14}o$/.test(r) && r.slice(1, 15).includes('o'))).toBe(true); // a crack in the slab
    expect(rig.grid[rig.grid.length - 1]).toMatch(/^o+\.+o+$/); // two stones on the ground line, apart
  });
});
