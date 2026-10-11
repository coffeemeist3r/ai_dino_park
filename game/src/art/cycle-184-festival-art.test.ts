import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { festivalRite } from '../world/festival';
import { worldPlacedProps } from '../world/reachability';

/** BACKLOG-598 — the spring and summer rite marks at the pond (host 597). */
describe('cycle 184-art — festival marks', () => {
  for (const season of ['spring', 'summer'] as const) {
    const key = festivalRite(season).artKey;
    const rig = PROP_RIGS[key];
    it(`${key} is a square 16px grid whose palette is exactly what it inks, on the family rim, and placed`, () => {
      expect(rig).toBeDefined();
      expect(rig.grid).toHaveLength(16);
      for (const row of rig.grid) expect(row).toHaveLength(16);
      expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
      expect(propCharsUsed(rig.grid)).toEqual(new Set(Object.keys(rig.palette)));
      expect(rig.palette.o).toBe(PROP_RIGS.welcome.palette.o);
      expect(worldPlacedProps().has(key)).toBe(true);
    });
  }
  it('the wreath is a ring: its centre is empty and blossoms sit on all four quarters', () => {
    const g = PROP_RIGS['festival-spring'].grid;
    expect(g[7].slice(5, 11)).toBe('......');
    const hearts = g.flatMap((row, y) => [...row].map((c, x) => (c === 'y' ? [x, y] : null)).filter(Boolean));
    expect(hearts).toHaveLength(4);
  });
  it('the sun stands on a post that reaches the ground', () => {
    const g = PROP_RIGS['festival-summer'].grid;
    for (let y = 8; y <= 14; y++) expect(g[y]).toContain('bk');
  });
  it('fall and winter are still undrawn and keep their glyphs', () => {
    expect(PROP_RIGS['festival-fall']).toBeUndefined();
    expect(PROP_RIGS['festival-winter']).toBeUndefined();
  });
});
