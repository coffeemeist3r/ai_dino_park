import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from './propArt';
import { DOZE_ART_KEY, ROUSE_ART_KEY } from '../world/chronotype';
import { VIGIL_ART_KEY } from '../world/vigil';

const doze = PROP_RIGS[DOZE_ART_KEY];
const rouse = PROP_RIGS[ROUSE_ART_KEY];
const vigil = PROP_RIGS[VIGIL_ART_KEY];

const cells = (r: typeof vigil) => r.grid.join('').split('').filter((c) => c !== '.');
const lum = (hex: number) => {
  const [r, g, b] = [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const lums = (r: typeof vigil) => Object.values(r.palette).map(lum);

describe('BACKLOG-526 — the vigil mark is well formed', () => {
  it('is a square 16px grid with a GBA-legal palette', () => {
    expect(vigil).toBeDefined();
    expect(vigil.size).toBe(16);
    expect(vigil.grid).toHaveLength(16);
    for (const row of vigil.grid) expect(row).toHaveLength(16);
    const keys = Object.keys(vigil.palette);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.length).toBeLessThanOrEqual(8);
    expect(new Set(cells(vigil))).toEqual(new Set(keys));
  });
});

describe('BACKLOG-526 — one axis, now three marks', () => {
  it('carries the same ink weight as its two siblings — one family, not a bigger badge', () => {
    // The rejected first draft failed exactly here: two full-size `rouse` eyes came out at 132 lit cells,
    // half again the heaviest mark in the park. The pair has to sit *between* its siblings, not above them.
    const n = cells(vigil).length;
    expect(n).toBeGreaterThan(cells(doze).length);
    expect(n).toBeLessThan(cells(rouse).length * 1.2);
  });

  it('shares the watcher’s outline and sclera verbatim, so the family claim is a fact and not a comment', () => {
    expect(vigil.palette.o).toBe(rouse.palette.o);
    expect(vigil.palette.W).toBe(rouse.palette.W);
  });

  it('leaves `rouse` the brightest pixel in the park — one eye noticing beats two eyes staring', () => {
    expect(lum(vigil.palette.c)).toBeLessThan(lum(rouse.palette.c));
    expect(Math.max(...lums(vigil))).toBeLessThan(Math.max(...lums(rouse)));
  });

  it('is a *pair*, which is the whole read: two separated eyes on the same rows', () => {
    // A single open eye at this size reads as awake whichever way its pupil points — being *looked at* can
    // only be said with two. Machine-checkable version: every row that carries ink carries it in two runs
    // with clear ground between, and the two halves are mirror-equal in weight.
    const inked = vigil.grid.filter((r) => r.includes('o') || r.includes('W'));
    expect(inked.length).toBeGreaterThan(0);
    for (const row of inked) {
      const runs = row.split('.').filter((s) => s.length > 0);
      expect(runs).toHaveLength(2);
    }
    const half = (side: 0 | 1) =>
      vigil.grid.map((r) => (side === 0 ? r.slice(0, 8) : r.slice(8))).join('').replace(/\./g, '').length;
    expect(half(0)).toBe(half(1));
  });

  it('points both pupils the same way, so the pair reads as one gaze rather than two wandering eyes', () => {
    const rows = vigil.grid.filter((r) => r.includes('c'));
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      const left = row.slice(0, 8).indexOf('c');
      const right = row.slice(8).indexOf('c');
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeGreaterThanOrEqual(0);
      // Same offset within each eye — one light source, both eyes facing it. Mirrored catchlights would
      // read as the two eyes looking away from each other, which is the opposite of the beat.
      expect(left).toBe(right);
    }
  });
});
