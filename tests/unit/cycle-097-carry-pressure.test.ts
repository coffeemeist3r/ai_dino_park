import { describe, it, expect } from 'vitest';
import {
  pressuredCarry,
  directedCarry,
  pileTotal,
  overSoftCap,
  STOCKPILE_SOFT_CAP,
  STOCKPILE_CAP,
  PRESSURE_CARRY,
  type Stockpile,
} from '../../game/src/world/resource';

/**
 * Zone carry pressure (BACKLOG-429). A zone over its soft cap sheds its glut toward a *lighter* neighbour —
 * up to PRESSURE_CARRY of its most-stocked kinds — instead of the single directed kind. Below the cap, or
 * toward a heavier/equal neighbour, it's byte-identical to the directed carry (356/377). Lossless + cap-safe.
 */

const total = (p: Stockpile) => pileTotal(p);

describe('overSoftCap / pileTotal', () => {
  it('flags a pile whose total exceeds the soft cap', () => {
    expect(overSoftCap({ stone: STOCKPILE_SOFT_CAP })).toBe(false); // == cap is not over
    expect(overSoftCap({ stone: STOCKPILE_SOFT_CAP + 1 })).toBe(true);
    expect(pileTotal({ stone: 3, branch: 2 })).toBe(5);
  });
});

describe('pressuredCarry (BACKLOG-429)', () => {
  it('is byte-identical to the single directed carry when the source is under the soft cap', () => {
    const src: Stockpile = { stone: 2, branch: 1 }; // total 3 ≤ soft cap
    const dest: Stockpile = {};
    expect(pressuredCarry(src, dest)).toEqual([directedCarry(src, dest)]); // one directed kind
  });

  it('sheds up to PRESSURE_CARRY most-stocked kinds toward a strictly-lighter neighbour when over cap', () => {
    const src: Stockpile = { branch: 4, stone: 4 }; // total 8 > soft cap 6
    const dest: Stockpile = {}; // lighter
    const carried = pressuredCarry(src, dest);
    expect(carried.length).toBe(PRESSURE_CARRY);
    expect(carried).toEqual(['branch', 'stone']); // glut shed, branch-before-stone on the tie
  });

  it('does NOT boost toward a heavier/equal neighbour (never pushes into a fuller zone)', () => {
    const src: Stockpile = { stone: 5, branch: 3 }; // total 8 > cap
    const dest: Stockpile = { stone: 8, branch: 1 }; // total 9 — heavier
    expect(pressuredCarry(src, dest).length).toBe(1); // single directed kind, no pressure boost
  });

  it('stays cap-safe — stops shedding a kind the destination can no longer accept', () => {
    const src: Stockpile = { stone: 8 }; // total 8 > cap, only stone
    const dest: Stockpile = { stone: STOCKPILE_CAP - 1 }; // total 7 < 8 (lighter) but one below the hard cap
    const carried = pressuredCarry(src, dest);
    expect(carried).toEqual(['stone']); // one fills the dest to cap; the second is refused
  });

  it('never sheds more than the source can supply', () => {
    const src: Stockpile = { branch: 1 }; // over nothing; a lone unit
    const dest: Stockpile = {};
    // one branch, under cap → single directed carry, and it can only be the branch it has
    expect(pressuredCarry(src, dest)).toEqual(['branch']);
    // a source that IS over cap but holds few kinds can't shed phantom units
    const glut: Stockpile = { stone: 7 }; // total 7 > cap, dest empty (lighter)
    const carried = pressuredCarry(glut, dest);
    expect(carried.every((k) => k === 'stone')).toBe(true);
    expect(carried.length).toBeLessThanOrEqual(total(glut));
  });

  it('returns [] when the source is empty (nothing to carry)', () => {
    expect(pressuredCarry({}, {})).toEqual([]);
  });
});
