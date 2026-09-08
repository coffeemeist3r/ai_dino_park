/**
 * BACKLOG-537 (cycle 154-art) — the hands on the ruin.
 *
 * The sixth mark on BACKLOG-520's axis, and the first one that is not a face or a feeling. The tests below
 * are family claims rather than a description of the picture: what has to hold is that this reads as the
 * same family as the five eyes and thoughts beside it, and that its silhouette is emphatically *not* one of
 * them — because the meaning is not.
 */

import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from '../../game/src/art/propArt';
import { MEND_ART_KEY } from '../../game/src/world/mending';
import { worldPlacedProps } from '../../game/src/world/reachability';

const FAMILY = ['doze', 'rouse', 'vigil', 'missed', 'missed_aloof', MEND_ART_KEY];
const lit = (name: string) =>
  PROP_RIGS[name].grid.reduce((n, row) => n + [...row].filter((c) => c !== '.').length, 0);

describe('the mend mark is one of the family (BACKLOG-537)', () => {
  it('exists under the key the scene looks up', () => {
    expect(PROP_RIGS[MEND_ART_KEY]).toBeDefined();
    expect(MEND_ART_KEY).toBe('mend');
  });

  it('is a square 16-grid like every sibling', () => {
    for (const n of FAMILY) {
      expect(PROP_RIGS[n].size, n).toBe(16);
      expect(PROP_RIGS[n].grid.length, n).toBe(16);
      for (const row of PROP_RIGS[n].grid) expect(row.length, n).toBe(16);
    }
  });

  it('shares the family outline exactly — one axis, one rim', () => {
    expect(PROP_RIGS[MEND_ART_KEY].palette.o).toBe(PROP_RIGS.rouse.palette.o);
  });

  it('stays inside the eight-colour budget', () => {
    expect(Object.keys(PROP_RIGS[MEND_ART_KEY].palette).length).toBeLessThanOrEqual(8);
  });

  it('is its own picture — no two marks in the family share a grid', () => {
    const grids = FAMILY.map((n) => PROP_RIGS[n].grid.join('\n'));
    expect(new Set(grids).size).toBe(FAMILY.length);
  });
});

describe('the tells, which are both about it being a tool rather than a face', () => {
  it('gives the haft the warmest, and by a distance the most saturated, colour on the axis', () => {
    // Not "the only warm colour" — `doze` lifts its ramp off black with a faint warmth, and a claim of
    // exclusivity would have been false the moment it was written. What is true and is the tell: the haft
    // is *wood*, and nothing else on this axis is anywhere near it for saturation.
    const sat = (c: number) => {
      const [r, g, b] = [(c >> 16) & 0xff, (c >> 8) & 0xff, c & 0xff];
      return Math.max(r, g, b) - Math.min(r, g, b);
    };
    const haft = PROP_RIGS[MEND_ART_KEY].palette.h;
    for (const n of FAMILY.filter((f) => f !== MEND_ART_KEY)) {
      for (const [k, c] of Object.entries(PROP_RIGS[n].palette)) {
        expect(sat(haft), `${n}.${k}`).toBeGreaterThan(sat(c));
      }
    }
  });

  it('is the heaviest mark in the park, which is the order the family already runs in', () => {
    // A thought a dino is trying not to have is the faintest thing it can wear; sleep is next; an errand
    // it is actually walking should out-read both. The weights encode how much the dino is *doing*.
    expect(lit(MEND_ART_KEY)).toBeGreaterThan(lit('doze'));
    expect(lit(MEND_ART_KEY)).toBeGreaterThan(lit('missed'));
  });

  it('has an axis — the haft is a real diagonal, not a face with a stick under it', () => {
    // The eyes in this family are not mirror-symmetric either (a catchlight is off-centre by definition),
    // so symmetry is the wrong test. The claim that actually separates a tool from a face is that the
    // silhouette *travels*: the lit cells step one column right per row all the way down the haft.
    const grid = PROP_RIGS[MEND_ART_KEY].grid;
    const left = (row: string) => row.indexOf('o');
    for (let r = 8; r <= 12; r++) {
      expect(left(grid[r]), `row ${r}`).toBe(left(grid[r - 1]) + 1);
    }
  });
});

describe('the host, which is the reason this could be drawn at all', () => {
  it('is a prop the shipping world actually places (the cycle-145 amendment)', () => {
    expect(worldPlacedProps().has(MEND_ART_KEY)).toBe(true);
  });
});
