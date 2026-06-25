import { describe, it, expect } from 'vitest';
import { pickCarry, takeResource, STOCKPILE_CAP, type Stockpile } from '../../game/src/world/resource';

/**
 * Carry between zones (BACKLOG-329). A dino crossing zones ferries one banked resource from the pile it
 * leaves into the pile it enters. `pickCarry` decides which kind moves; `takeResource` removes it. Pure.
 */

const total = (p: Stockpile) => (p.branch ?? 0) + (p.stone ?? 0);

describe('pickCarry — which kind a crosser ferries', () => {
  it('picks the most-stocked acceptable kind', () => {
    expect(pickCarry({ branch: 1, stone: 5 }, {})).toBe('stone');
    expect(pickCarry({ branch: 4, stone: 2 }, {})).toBe('branch');
  });

  it('on a tie, keeps RESOURCE_GLYPH order (branch before stone)', () => {
    expect(pickCarry({ branch: 2, stone: 2 }, {})).toBe('branch');
  });

  it('returns null when the source pile is empty', () => {
    expect(pickCarry({}, {})).toBeNull();
    expect(pickCarry({ branch: 0, stone: 0 }, {})).toBeNull();
  });

  it('skips a kind the destination is at cap for, and is null when every kind is capped', () => {
    const full: Stockpile = { branch: STOCKPILE_CAP, stone: STOCKPILE_CAP };
    expect(pickCarry({ branch: 1, stone: 1 }, full)).toBeNull();
    // branch capped at dest → carry the stone instead
    expect(pickCarry({ branch: 5, stone: 1 }, { branch: STOCKPILE_CAP })).toBe('stone');
  });
});

describe('takeResource — remove one of a kind', () => {
  it('decrements and never goes below zero', () => {
    expect(takeResource({ branch: 2 }, 'branch')).toEqual({ branch: 1 });
    expect(takeResource({ branch: 0 }, 'branch')).toEqual({ branch: 0 });
    expect(takeResource({}, 'stone')).toEqual({});
  });

  it('does not mutate the input pile', () => {
    const src: Stockpile = { branch: 2 };
    takeResource(src, 'branch');
    expect(src).toEqual({ branch: 2 });
  });
});

describe('a carry conserves the two-pile total', () => {
  it('one out of source equals one into dest', () => {
    const src: Stockpile = { branch: 3, stone: 1 };
    const dest: Stockpile = { stone: 2 };
    const kind = pickCarry(src, dest)!;
    const before = total(src) + total(dest);
    const src2 = takeResource(src, kind);
    const dest2: Stockpile = { ...dest, [kind]: (dest[kind] ?? 0) + 1 };
    expect(total(src2) + total(dest2)).toBe(before);
    expect(total(src2)).toBe(total(src) - 1);
    expect(total(dest2)).toBe(total(dest) + 1);
  });
});
