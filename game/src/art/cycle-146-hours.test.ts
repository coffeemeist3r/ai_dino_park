import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from './propArt';
import { DOZE_ART_KEY, ROUSE_ART_KEY } from '../world/chronotype';

const doze = PROP_RIGS[DOZE_ART_KEY];
const rouse = PROP_RIGS[ROUSE_ART_KEY];

const cells = (r: typeof doze) => r.grid.join('').split('').filter((c) => c !== '.');
const lum = (hex: number) => {
  const [r, g, b] = [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const lums = (r: typeof doze) => Object.values(r.palette).map(lum);
/** Blue minus red — positive is a cool colour, negative a warm one. */
const temp = (hex: number) => (hex & 0xff) - ((hex >> 16) & 0xff);

describe('BACKLOG-520 — both rigs are well formed', () => {
  for (const [name, rig] of [['doze', doze], ['rouse', rouse]] as const) {
    it(`${name} is a square 16px grid with a GBA-legal palette`, () => {
      expect(rig).toBeDefined();
      expect(rig.size).toBe(16);
      expect(rig.grid).toHaveLength(16);
      for (const row of rig.grid) expect(row).toHaveLength(16);
      const keys = Object.keys(rig.palette);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.length).toBeLessThanOrEqual(8);
      // Every character drawn is a colour, and every colour declared is drawn.
      expect(new Set(cells(rig))).toEqual(new Set(keys));
    });
  }
});

describe('BACKLOG-520 — one axis, two ends', () => {
  it('shares a silhouette family: both are eye-sized, neither fills the tile', () => {
    // The pair has to read as the same fact at opposite ends, not as two unrelated symbols. Cheapest
    // machine-checkable version of that: comparable ink, both well inside the 256-cell tile.
    expect(cells(doze).length).toBeGreaterThan(30);
    expect(cells(rouse).length).toBeGreaterThan(30);
    expect(cells(doze).length).toBeLessThan(200);
    expect(cells(rouse).length).toBeLessThan(200);
  });

  it('is low-contrast asleep and high-contrast awake — the read from across the field', () => {
    const spread = (r: typeof doze) => Math.max(...lums(r)) - Math.min(...lums(r));
    expect(spread(rouse)).toBeGreaterThan(spread(doze) * 2);
  });

  it('puts no pixel in doze brighter than rouse is at its dimmest lit colour', () => {
    // The doze must recede and the rouse must catch the light. Stated as a number so a later repaint
    // cannot quietly erase the difference: the brightest thing in the sleeping mark stays under the
    // sclera of the waking one.
    expect(Math.max(...lums(doze))).toBeLessThan(lum(rouse.palette.W));
  });

  it('separates the two by temperature as well as by value', () => {
    // Warm outline for the sleeper, cool for the watcher — so the pair still reads apart for a player
    // who cannot rely on brightness alone.
    expect(temp(doze.palette.o)).toBeLessThan(0);
    expect(temp(rouse.palette.o)).toBeGreaterThan(0);
  });

  it('gives rouse a catchlight that is the brightest pixel in either rig', () => {
    const brightest = Math.max(...lums(doze), ...lums(rouse));
    expect(lum(rouse.palette.c)).toBe(brightest);
  });

  it('keeps the catchlight off-centre inside the pupil, so it reads wet rather than holed', () => {
    const row = rouse.grid.findIndex((r) => r.includes('c'));
    const col = rouse.grid[row].indexOf('c');
    // Above and left of the pupil's own middle — the pupil spans rows 6..8 and is centred on col 8.
    expect(row).toBeLessThan(8);
    expect(col).toBeLessThan(8);
  });

  it('draws the sleeper shut and the watcher open — the axis itself', () => {
    // doze carries a lid ('L') and no pupil; rouse carries a pupil ('I') and no lid. If a later edit
    // ever gave them both the same interior, the pair would stop being one axis.
    expect(Object.keys(doze.palette)).toContain('L');
    expect(Object.keys(doze.palette)).not.toContain('I');
    expect(Object.keys(rouse.palette)).toContain('I');
    expect(Object.keys(rouse.palette)).not.toContain('L');
  });
});
