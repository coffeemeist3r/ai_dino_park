import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { MISSED_ALOOF_ART_KEY, MISSED_ART_KEY } from '../world/missed';
import { NEED_ART_KEY } from '../world/needs';

const rouse = PROP_RIGS[ROUSE_ART_KEY];
const missed = PROP_RIGS[MISSED_ART_KEY];
const aloof = PROP_RIGS[MISSED_ALOOF_ART_KEY];
const hunger = PROP_RIGS[NEED_ART_KEY.hunger];
const thirst = PROP_RIGS[NEED_ART_KEY.thirst];

const cells = (r: typeof hunger) => r.grid.join('').split('').filter((c) => c !== '.');
const runs = (row: string) => row.split('.').filter((s) => s.length > 0);

describe('BACKLOG-550 — both need marks are well formed', () => {
  for (const [name, rig] of [
    ['hunger', hunger],
    ['thirst', thirst],
  ] as const) {
    it(`${name} is a square 16px grid whose palette is exactly what it inks`, () => {
      expect(rig).toBeDefined();
      expect(rig.size).toBe(16);
      expect(rig.grid).toHaveLength(16);
      for (const row of rig.grid) expect(row).toHaveLength(16);
      const keys = Object.keys(rig.palette);
      expect(keys.length).toBeGreaterThan(0);
      expect(keys.length).toBeLessThanOrEqual(8);
      expect(new Set(cells(rig))).toEqual(new Set(keys));
    });
  }
});

describe('BACKLOG-550 — the same family', () => {
  it('shares the outline with the family, verbatim — one axis, one rim', () => {
    expect(hunger.palette.o).toBe(rouse.palette.o);
    expect(thirst.palette.o).toBe(rouse.palette.o);
  });

  it('sits inside the family by weight — neither the heaviest nor the lightest thing in the park', () => {
    // `aloof` is the lightest mark by design (534) and nothing here may take that from it.
    for (const rig of [hunger, thirst]) {
      expect(cells(rig).length).toBeGreaterThan(cells(aloof).length);
      expect(cells(rig).length).toBeLessThan(cells(rouse).length);
    }
  });

  it('is two different pictures, not one picture twice', () => {
    expect(hunger.grid).not.toEqual(thirst.grid);
  });
});

describe('BACKLOG-550 — the two reads, at 12px', () => {
  /**
   * The failure the seed named in advance: a haunch of meat. A haunch is a solid brown blob at this size
   * *and* it says "here is food", which is the opposite of what the mark means. The shipped read is an
   * absence — so the body of the pouch must actually be open, every wall row two runs and not one.
   */
  it('hunger is hollow — the mark whose subject is that there is nothing there', () => {
    // A body row is one with wall on both sides and a gap between: `oS.......So`.
    const bodyRows = hunger.grid.filter((r) => /S\.+/.test(r));
    expect(bodyRows.length).toBeGreaterThan(3);
    for (const row of bodyRows) expect(runs(row).length).toBe(2);
  });

  it('hunger is lit off-centre, so a hollow ring does not read as a letter O', () => {
    const mirrored = hunger.grid.map((r) => [...r].reverse().join(''));
    expect(mirrored).not.toEqual([...hunger.grid]);
    expect(hunger.palette.L).toBeDefined();
  });

  it('thirst is solid — the pair reads as a contrast, one empty and one full', () => {
    const drop = thirst.grid.filter((r) => r.includes('W'));
    expect(drop.length).toBeGreaterThan(5);
    // Every row of the droplet is one unbroken run: nothing shows through it.
    for (const row of drop) expect(runs(row).length).toBe(1);
  });

  it('thirst has a tongue under the drop — a droplet alone is weather, not an animal', () => {
    const tongueRows = thirst.grid.map((r, y) => ({ y, has: r.includes('T') })).filter((r) => r.has).map((r) => r.y);
    const dropRows = thirst.grid.map((r, y) => ({ y, has: r.includes('W') })).filter((r) => r.has).map((r) => r.y);
    expect(tongueRows.length).toBeGreaterThan(0);
    expect(Math.min(...tongueRows)).toBeGreaterThan(Math.max(...dropRows));
    expect(thirst.palette.T).not.toBe(thirst.palette.W);
  });

  it('neither is the other one recoloured — the silhouettes differ, not just the palettes', () => {
    const shape = (r: typeof hunger) => r.grid.map((row) => row.replace(/[^.]/g, '#'));
    expect(shape(hunger)).not.toEqual(shape(thirst));
    // ...and the same guard cycle 152 put on the aloof mark: nothing in the family is a dimmed sibling.
    expect(shape(hunger)).not.toEqual(shape(missed));
  });
});
