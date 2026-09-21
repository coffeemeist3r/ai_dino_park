import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { MISSED_ALOOF_ART_KEY, MISSED_ART_KEY } from '../world/missed';
import { MEND_ART_KEY } from '../world/mending';
import { VIGIL_ART_KEY } from '../world/vigil';
import { GLANCE_ART_KEY } from '../world/parting';
import { NEED_ART_KEY } from '../world/needs';
import { MOPE_ART_KEY } from '../world/loner';

const mope = PROP_RIGS[MOPE_ART_KEY];
const rouse = PROP_RIGS[ROUSE_ART_KEY];
const aloof = PROP_RIGS[MISSED_ALOOF_ART_KEY];

const cells = (r: typeof mope) => r.grid.join('').split('').filter((c) => c !== '.').length;
const shape = (r: typeof mope) => r.grid.map((row) => row.replace(/[^.]/g, '#'));
const rowsWith = (r: typeof mope, ch: string) =>
  r.grid.map((row, y) => ({ y, has: row.includes(ch) })).filter((e) => e.has).map((e) => e.y);

describe('BACKLOG-556 — the wilt is well formed', () => {
  it('is a square 16px grid whose palette is exactly what it inks', () => {
    expect(mope).toBeDefined();
    expect(mope.size).toBe(16);
    expect(mope.grid).toHaveLength(16);
    for (const row of mope.grid) expect(row).toHaveLength(16);
    const keys = Object.keys(mope.palette);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.length).toBeLessThanOrEqual(8);
    expect(propCharsUsed(mope.grid)).toEqual(new Set(keys));
  });
});

describe('BACKLOG-556 — the same family', () => {
  it('shares the family outline with rouse, verbatim', () => {
    expect(mope.palette.o).toBe(rouse.palette.o);
  });

  // The cycle-155 correction: claim the weight against *every* sibling, not a convenient one.
  it('sits inside the family by weight — heavier than the lightest, lighter than the heaviest', () => {
    const siblings = [
      ROUSE_ART_KEY,
      MISSED_ART_KEY,
      MISSED_ALOOF_ART_KEY,
      MEND_ART_KEY,
      VIGIL_ART_KEY,
      GLANCE_ART_KEY,
      NEED_ART_KEY.hunger,
      NEED_ART_KEY.thirst,
    ].map((k) => cells(PROP_RIGS[k]));
    expect(cells(mope)).toBeGreaterThan(Math.min(...siblings));
    expect(cells(mope)).toBeLessThan(Math.max(...siblings));
    // `aloof` is the lightest mark by design (534) and nothing here may take that from it.
    expect(cells(mope)).toBeGreaterThan(cells(aloof));
  });

  it('is nobody else recoloured — the silhouette is its own', () => {
    for (const k of [ROUSE_ART_KEY, MISSED_ART_KEY, MEND_ART_KEY, VIGIL_ART_KEY, GLANCE_ART_KEY]) {
      expect(shape(mope)).not.toEqual(shape(PROP_RIGS[k]));
    }
  });
});

describe('BACKLOG-556 — the read at 12px, which is the bend and nothing else', () => {
  /**
   * The rejected first draft: the head level with the bend, sitting on the arc like a berry. That reads
   * as a *bud* — something about to happen — which is the opposite of the mark's meaning. The head has to
   * hang strictly below the crown of the arc.
   */
  it('hangs its head below the crown of the arc', () => {
    const head = rowsWith(mope, 'P');
    const stem = rowsWith(mope, 's');
    expect(head.length).toBeGreaterThan(3);
    expect(Math.min(...head)).toBeGreaterThan(Math.min(...stem));
  });

  it('is a long line and a small head, not a walking stick with a knob', () => {
    const stem = rowsWith(mope, 's');
    const headWidth = Math.max(...mope.grid.map((r) => (r.match(/P+/g) ?? ['']).join('').length));
    expect(stem.length).toBeGreaterThan(headWidth);
  });

  it('is asymmetric — a wilt bends one way, and a symmetric mark would read as a lamp', () => {
    const mirrored = mope.grid.map((r) => [...r].reverse().join(''));
    expect(mirrored).not.toEqual([...mope.grid]);
  });

  it('lights the head off-centre, so it is not a symmetric bead', () => {
    expect(mope.palette.p).toBeDefined();
    expect(mope.palette.p).not.toBe(mope.palette.P);
    const lift = rowsWith(mope, 'p');
    expect(lift.length).toBeGreaterThan(0);
    for (const y of lift) {
      const row = mope.grid[y];
      const head = [...row].map((c, x) => ({ c, x })).filter((e) => e.c === 'P' || e.c === 'p');
      const mid = Math.floor((head[0].x + head[head.length - 1].x) / 2);
      expect(row.indexOf('p')).not.toBe(mid);
    }
  });

  it('keeps the stem desaturated — a healthy green here would read as a plant, not a mood', () => {
    const g = (c: number) => (c >> 8) & 0xff;
    const r = (c: number) => (c >> 16) & 0xff;
    const b = (c: number) => c & 0xff;
    const stem = mope.palette.s;
    // The green channel leads, but not by the margin a vivid leaf would show.
    expect(g(stem)).toBeGreaterThan(r(stem));
    expect(g(stem)).toBeGreaterThan(b(stem));
    expect(g(stem) - Math.max(r(stem), b(stem))).toBeLessThan(0x40);
  });
});
