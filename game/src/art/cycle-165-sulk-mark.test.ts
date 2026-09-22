import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { MISSED_ALOOF_ART_KEY, MISSED_ART_KEY } from '../world/missed';
import { MEND_ART_KEY } from '../world/mending';
import { VIGIL_ART_KEY } from '../world/vigil';
import { GLANCE_ART_KEY } from '../world/parting';
import { NEED_ART_KEY } from '../world/needs';
import { MOPE_ART_KEY } from '../world/loner';
import { SULK_ART_KEY } from '../world/expiry';

const sulk = PROP_RIGS[SULK_ART_KEY];
const rouse = PROP_RIGS[ROUSE_ART_KEY];
const aloof = PROP_RIGS[MISSED_ALOOF_ART_KEY];

const cells = (r: typeof sulk) => r.grid.join('').split('').filter((c) => c !== '.').length;
const shape = (r: typeof sulk) => r.grid.map((row) => row.replace(/[^.]/g, '#'));
const colsWith = (r: typeof sulk, ch: string) =>
  r.grid.flatMap((row) => [...row].map((c, x) => (c === ch ? x : -1)).filter((x) => x >= 0));
const rowsWith = (r: typeof sulk, ch: string) =>
  r.grid.map((row, y) => ({ y, has: row.includes(ch) })).filter((e) => e.has).map((e) => e.y);

describe('BACKLOG-543 — the sulk is well formed', () => {
  it('is a square 16px grid whose palette is exactly what it inks', () => {
    expect(sulk).toBeDefined();
    expect(sulk.size).toBe(16);
    expect(sulk.grid).toHaveLength(16);
    for (const row of sulk.grid) expect(row).toHaveLength(16);
    const keys = Object.keys(sulk.palette);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.length).toBeLessThanOrEqual(8); // GBA discipline
    expect(propCharsUsed(sulk.grid)).toEqual(new Set(keys));
  });
});

describe('BACKLOG-543 — the same family', () => {
  it('shares the family outline with rouse, verbatim', () => {
    expect(sulk.palette.o).toBe(rouse.palette.o);
  });

  // The cycle-155 correction: claim the weight against *every* sibling, not a convenient one.
  it('sits inside the family by weight', () => {
    const siblings = [
      ROUSE_ART_KEY,
      MISSED_ART_KEY,
      MISSED_ALOOF_ART_KEY,
      MEND_ART_KEY,
      VIGIL_ART_KEY,
      GLANCE_ART_KEY,
      NEED_ART_KEY.hunger,
      NEED_ART_KEY.thirst,
      MOPE_ART_KEY,
    ].map((k) => cells(PROP_RIGS[k]));
    expect(cells(sulk)).toBeGreaterThan(Math.min(...siblings));
    expect(cells(sulk)).toBeLessThan(Math.max(...siblings));
    // `aloof` is the lightest mark by design (534) and nothing here may take that from it; `rouse` keeps
    // the heaviest claim it has held since 520. This one is the heaviest of the *body* marks, which is
    // what a whole posture costs against a feature.
    expect(cells(sulk)).toBeGreaterThan(cells(aloof));
    expect(cells(sulk)).toBeLessThan(cells(rouse));
  });

  it('is nobody else recoloured — the silhouette is its own', () => {
    for (const k of [
      ROUSE_ART_KEY,
      MISSED_ART_KEY,
      MISSED_ALOOF_ART_KEY,
      MEND_ART_KEY,
      VIGIL_ART_KEY,
      GLANCE_ART_KEY,
      MOPE_ART_KEY,
    ]) {
      expect(shape(sulk)).not.toEqual(shape(PROP_RIGS[k]));
    }
  });
});

describe('BACKLOG-543 — the read at 12px, which is the turned head and the raised shoulder', () => {
  /**
   * The mark's whole meaning. Every sibling that is a head says something *with* an eye; this one says
   * something by having turned the eye away — so a single lit pixel of face would be the mark arguing
   * with itself. Pinned rather than trusted to the author's eye, on the cycle-164 precedent.
   */
  it('gives the head no face at all', () => {
    const faceTones = [rouse.palette.W, rouse.palette.i, rouse.palette.I, rouse.palette.c];
    for (const tone of faceTones) {
      expect(Object.values(sulk.palette)).not.toContain(tone);
    }
    // And structurally: the head's two tones are the only things inside its outline.
    const headRows = sulk.grid.slice(3, 9);
    for (const row of headRows) {
      expect(row.slice(0, 9)).toMatch(/^[.oHh]*$/);
    }
  });

  it('raises the shoulder across the head — it rises to the right, it does not sit level', () => {
    const topOf = (ch: string) =>
      sulk.grid.map((row, y) => ({ y, x: row.indexOf(ch) })).filter((e) => e.x >= 0);
    const ridge = topOf('T');
    expect(ridge.length).toBeGreaterThan(2);
    // The higher the row (smaller y), the further right the ridge starts: a diagonal, not a shelf.
    const sorted = [...ridge].sort((a, b) => a.y - b.y);
    for (let i = 1; i < sorted.length; i += 1) expect(sorted[i].x).toBeLessThan(sorted[i - 1].x);
  });

  it('puts the head left and the shoulder right — the two masses do not overlap columns much', () => {
    const head = colsWith(sulk, 'h');
    const shoulder = colsWith(sulk, 'S');
    expect(Math.max(...head)).toBeLessThan(Math.min(...shoulder));
  });

  it('is asymmetric — a symmetric sulk would read as a hill', () => {
    const mirrored = sulk.grid.map((r) => [...r].reverse().join(''));
    expect(mirrored).not.toEqual([...sulk.grid]);
  });

  it('keeps the whole mark cool and low-contrast — a mood recedes', () => {
    const blue = (c: number) => c & 0xff;
    const red = (c: number) => (c >> 16) & 0xff;
    for (const tone of [sulk.palette.H, sulk.palette.h, sulk.palette.S, sulk.palette.T]) {
      expect(blue(tone)).toBeGreaterThan(red(tone)); // cool, never the wilt's warm rose
    }
    // The brightest pixel here is dimmer than `rouse`'s catchlight by a distance — the same argument that
    // caught `doze`'s first draft. A sulking dino is a thing your eye should slide off.
    expect(sulk.palette.T).toBeLessThan(rouse.palette.c);
  });

  it('shades the head so a faceless blob still has form', () => {
    expect(sulk.palette.h).not.toBe(sulk.palette.H);
    expect(rowsWith(sulk, 'H').length).toBeGreaterThan(2);
    expect(rowsWith(sulk, 'h').length).toBeGreaterThan(2);
  });

  it("pitches the shoulder between the head's two tones, so the masses read as one animal", () => {
    const lum = (c: number) => ((c >> 16) & 0xff) + ((c >> 8) & 0xff) + (c & 0xff);
    expect(lum(sulk.palette.S)).toBeGreaterThan(lum(sulk.palette.h));
    expect(lum(sulk.palette.S)).toBeLessThan(lum(sulk.palette.H));
  });
});
