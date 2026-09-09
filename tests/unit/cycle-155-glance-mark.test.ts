/**
 * BACKLOG-540 (cycle 155-art) — the goodbye.
 *
 * The seventh mark on BACKLOG-520's axis. Like its siblings' specs, these are family claims and tells
 * rather than a description of the picture: it has to read as one of the family, and its silhouette has to
 * be emphatically *not* one of them, because its meaning is not — it is the only mark in the park addressed
 * to the player rather than describing the dino.
 */

import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from '../../game/src/art/propArt';
import { GLANCE_ART_KEY } from '../../game/src/world/parting';
import { MEND_ART_KEY } from '../../game/src/world/mending';
import { worldPlacedProps } from '../../game/src/world/reachability';

const FAMILY = ['doze', 'rouse', 'vigil', 'missed', 'missed_aloof', MEND_ART_KEY, GLANCE_ART_KEY];
const lit = (name: string) =>
  PROP_RIGS[name].grid.reduce((n, row) => n + [...row].filter((c) => c !== '.').length, 0);
const sat = (c: number) => {
  const [r, g, b] = [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff];
  return Math.max(r, g, b) - Math.min(r, g, b);
};

describe('the goodbye is one of the family (BACKLOG-540)', () => {
  it('exists under the key the scene looks up', () => {
    expect(PROP_RIGS[GLANCE_ART_KEY]).toBeDefined();
    expect(GLANCE_ART_KEY).toBe('glance');
  });

  it('is a square 16-grid like every sibling', () => {
    for (const n of FAMILY) {
      expect(PROP_RIGS[n].size, n).toBe(16);
      expect(PROP_RIGS[n].grid.length, n).toBe(16);
      for (const row of PROP_RIGS[n].grid) expect(row.length, n).toBe(16);
    }
  });

  it('shares the family outline exactly — one axis, one rim', () => {
    expect(PROP_RIGS[GLANCE_ART_KEY].palette.o).toBe(PROP_RIGS.rouse.palette.o);
  });

  it('stays inside the eight-colour budget', () => {
    expect(Object.keys(PROP_RIGS[GLANCE_ART_KEY].palette).length).toBeLessThanOrEqual(8);
  });

  it('is its own picture — no two marks in the family share a grid', () => {
    const grids = FAMILY.map((n) => PROP_RIGS[n].grid.join('\n'));
    expect(new Set(grids).size).toBe(FAMILY.length);
  });
});

describe('the tells, which are all about it being a hand and not a face', () => {
  it('has three fingers — the rows below the tip break into exactly three runs of hide', () => {
    // This is the claim that separates a hand from every circle on this axis, and it is also the record of
    // the rejected first draft: five splayed fingers at 16 cells is one lit column and one dark column
    // repeated, which bakes into a comb rather than a hand. Three fingers survive the size, and they are
    // what this park's cast actually has.
    const grid = PROP_RIGS[GLANCE_ART_KEY].grid;
    for (const r of [4, 5, 6]) {
      const runs = grid[r].split(/[.o]+/).filter(Boolean);
      expect(runs.length, `row ${r}`).toBe(3);
    }
  });

  it('stands the middle finger one row proud — a flat top is a mitten', () => {
    const grid = PROP_RIGS[GLANCE_ART_KEY].grid;
    const top = grid.findIndex((row) => row.includes('o'));
    const cols = [...grid[top]].flatMap((c, i) => (c === '.' ? [] : [i]));
    // The whole of the topmost row sits inside the middle finger's columns, and it costs two cells.
    expect(Math.min(...cols)).toBeGreaterThanOrEqual(6);
    expect(Math.max(...cols)).toBeLessThanOrEqual(9);
    expect(grid[top + 1].split(/[.o]+/).filter(Boolean).length, 'one finger at the tip').toBe(1);
  });

  it('out-reads every sibling but the one wide-open eye', () => {
    // The family's existing order runs by how much the dino is *doing*. This one is ordered by how long it
    // has: every other mark holds for as long as it is true, and this one holds for GLANCE_MS, so it is the
    // only mark that must be read before it is gone. `rouse` is the one exception and is allowed to be —
    // a single open eye is mostly sclera, so it fills its grid by construction rather than by intent.
    //
    // Written as a claim against *every* sibling with one named exception, which is the correction this
    // fire owes cycle 154: `mend`'s comment called 72 "the heaviest mark in the park" on the strength of
    // two comparisons, and it is false against `rouse` (110) and `vigil` (76).
    for (const n of FAMILY.filter((f) => f !== GLANCE_ART_KEY && f !== 'rouse')) {
      expect(lit(GLANCE_ART_KEY), n).toBeGreaterThan(lit(n));
    }
    expect(lit('rouse'), 'the one heavier mark, and the reason it is allowed to be').toBeGreaterThan(
      lit(GLANCE_ART_KEY),
    );
  });

  it('leaves the mend haft its own claim — the hide is the duller warm', () => {
    // Cycle 154 asserted the haft is by a distance the most saturated colour on this axis. A seventh
    // sibling in a warm tone is exactly what could have quietly falsified that, so it is checked here
    // rather than left to the day somebody widens 537's FAMILY list.
    expect(sat(PROP_RIGS[GLANCE_ART_KEY].palette.s)).toBeLessThan(sat(PROP_RIGS[MEND_ART_KEY].palette.h));
    expect(sat(PROP_RIGS[GLANCE_ART_KEY].palette.S)).toBeLessThan(sat(PROP_RIGS[MEND_ART_KEY].palette.h));
  });
});

describe('the host, which is the reason this could be drawn at all', () => {
  it('is a prop the shipping world actually places (the cycle-145 amendment)', () => {
    // Seeded in the morning and drawn the same night, because BACKLOG-119 built `refreshGlanceMarks` in
    // the same cycle as the seed. That is the condition the amendment asks for, met by construction.
    expect(worldPlacedProps().has(GLANCE_ART_KEY)).toBe(true);
  });
});
