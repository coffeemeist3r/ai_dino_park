import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { FRIEND_FOUND_ART_KEY } from '../world/loner';
import { WAIT_ART_KEY } from '../world/pecking';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-568 (the sprig over a loner finding a friend) and BACKLOG-576 (the hourglass over a cowed bully). */

for (const key of [FRIEND_FOUND_ART_KEY, WAIT_ART_KEY]) {
  describe(`cycle 175-art — ${key}`, () => {
    const rig = PROP_RIGS[key];
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
      expect(worldPlacedProps().has(key)).toBe(true);
    });
  });
}

describe('the sprig has no soil (the first draft read as a potted plant)', () => {
  it('nothing is inked below the stem’s end', () => {
    const g = PROP_RIGS[FRIEND_FOUND_ART_KEY].grid;
    for (const row of g.slice(13)) expect(row).toBe('.'.repeat(16));
  });
});

describe('the hourglass has only just begun', () => {
  it('more sand on top than below', () => {
    const g = PROP_RIGS[WAIT_ART_KEY].grid;
    const sand = (rows: readonly string[]) => rows.join('').split('y').length - 1;
    expect(sand(g.slice(0, 8))).toBeGreaterThan(sand(g.slice(8)));
  });
});
