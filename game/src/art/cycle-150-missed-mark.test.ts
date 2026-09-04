import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from './propArt';
import { DOZE_ART_KEY, ROUSE_ART_KEY } from '../world/chronotype';
import { VIGIL_ART_KEY } from '../world/vigil';
import { MISSED_ART_KEY } from '../world/missed';

const doze = PROP_RIGS[DOZE_ART_KEY];
const rouse = PROP_RIGS[ROUSE_ART_KEY];
const vigil = PROP_RIGS[VIGIL_ART_KEY];
const missed = PROP_RIGS[MISSED_ART_KEY];

const cells = (r: typeof missed) => r.grid.join('').split('').filter((c) => c !== '.');
const lum = (hex: number) => {
  const [r, g, b] = [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const lums = (r: typeof missed) => Object.values(r.palette).map(lum);

describe('BACKLOG-531 — the missed-you mark is well formed', () => {
  it('is a square 16px grid with a GBA-legal palette', () => {
    expect(missed).toBeDefined();
    expect(missed.size).toBe(16);
    expect(missed.grid).toHaveLength(16);
    for (const row of missed.grid) expect(row).toHaveLength(16);
    const keys = Object.keys(missed.palette);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.length).toBeLessThanOrEqual(8);
    expect(new Set(cells(missed))).toEqual(new Set(keys));
  });
});

describe('BACKLOG-531 — one axis, now four marks', () => {
  it('is the lightest mark in the park, and that ordering is deliberate', () => {
    // The faintest thing a dino can wear, and half of those wearing one wear it at MISSED_FAINT_ALPHA.
    // A thought somebody is trying not to have must not out-shout a dino asleep.
    const n = cells(missed).length;
    expect(n).toBeLessThan(cells(doze).length);
    expect(n).toBeLessThan(cells(vigil).length);
    expect(n).toBeLessThan(cells(rouse).length);
  });

  it('shares the family outline and ground verbatim, so the claim is a fact and not a comment', () => {
    expect(missed.palette.o).toBe(rouse.palette.o);
    expect(missed.palette.W).toBe(rouse.palette.W);
    expect(missed.palette.o).toBe(vigil.palette.o);
  });

  it('steps the catchlight down in the same order as the weights', () => {
    // rouse (heaviest) is the brightest pixel in the park's hour-marks; vigil sits under it; this sits
    // under both. Three marks, one ladder, asserted rather than described.
    expect(lum(missed.palette.c)).toBeLessThan(lum(vigil.palette.c));
    expect(lum(vigil.palette.c)).toBeLessThan(lum(rouse.palette.c));
    expect(Math.max(...lums(missed))).toBeLessThan(Math.max(...lums(vigil)));
  });

  it('is not an eye — the silhouette differs because the meaning does', () => {
    // The rejected first draft was a third eye variant with the pupil rolled away, which at 32px is
    // indistinguishable from `rouse`. An eye is symmetric about its own vertical centre; this is not,
    // because the tail rises from one side.
    const mirrored = missed.grid.map((r) => [...r].reverse().join(''));
    expect(mirrored).not.toEqual([...missed.grid]);
    // And it is a single body, not a pair: no row carries ink in two separated runs the way `vigil` does.
    for (const row of missed.grid) {
      const runs = row.split('.').filter((s) => s.length > 0);
      expect(runs.length).toBeLessThanOrEqual(1);
    }
  });

  it('reads as a thought rising from below: a body, then smaller marks under it, offset to one side', () => {
    const width = (row: string) => row.replace(/\./g, '').length;
    const inked = missed.grid.map((r, y) => ({ y, w: width(r) })).filter((r) => r.w > 0);
    const widest = Math.max(...inked.map((r) => r.w));
    const body = inked.filter((r) => r.w > 4);
    const tail = inked.filter((r) => r.w <= 4);
    expect(body.length).toBeGreaterThan(0);
    expect(tail.length).toBeGreaterThan(0);
    // Every tail row sits below every body row — the thought rises to the puff, it does not hang off it.
    expect(Math.min(...tail.map((r) => r.y))).toBeGreaterThan(Math.max(...body.map((r) => r.y)));
    // ...and each tail row is narrower than the body it feeds.
    for (const t of tail) expect(t.w).toBeLessThan(widest);
    // The tail drifts to one side rather than sitting under the puff's centre, which is what makes it a
    // trail from the dino instead of a stalk.
    const left = (row: string) => row.indexOf(row.replace(/\./g, '')[0]);
    const tailLefts = tail.map((r) => left(missed.grid[r.y]));
    expect(new Set(tailLefts).size).toBeGreaterThan(1);
  });
});
