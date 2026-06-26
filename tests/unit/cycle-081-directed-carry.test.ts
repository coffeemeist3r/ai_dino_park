import { describe, it, expect } from 'vitest';
import { directedCarry, pickCarry, CRAFT_RECIPE, STOCKPILE_CAP, type Stockpile } from '../../game/src/world/resource';

/**
 * Directed carry (BACKLOG-356). A crossing dino ferries the kind the destination zone is most short of for
 * its next craft (the cairn, CRAFT_RECIPE {branch:3, stone:2}), so carry actively balances the two piles.
 * When the destination has no fillable shortfall it falls back to `pickCarry` (a random spare still moves).
 */

describe('directedCarry — ferry what the destination needs (BACKLOG-356)', () => {
  it('picks the recipe kind the destination is most short of, even when it is the source minority', () => {
    // grove empty → needs branch:3, stone:2 (branch is the larger deficit). Bowl is stone-heavy.
    // pickCarry would move the stone (most-stocked); directedCarry moves the branch (the grove's bigger need).
    const src: Stockpile = { stone: 2, branch: 1 };
    expect(directedCarry(src, {})).toBe('branch');
    expect(pickCarry(src, {})).toBe('stone'); // proves the two differ — carry is now directed, not random
  });

  it('falls back to pickCarry when the destination has no fillable craft shortfall', () => {
    // dest already meets the recipe → no positive deficit → ferry a spare like the old carry.
    const src: Stockpile = { branch: 1, stone: 5 };
    const dest: Stockpile = { ...CRAFT_RECIPE };
    expect(directedCarry(src, dest)).toBe(pickCarry(src, dest));
    expect(directedCarry(src, dest)).toBe('stone'); // most-stocked spare
  });

  it('never chooses a kind the source cannot supply', () => {
    // grove needs both, but the bowl only has stone → carry stone, not the (more-needed) branch.
    expect(directedCarry({ stone: 1 }, {})).toBe('stone');
  });

  it('respects the destination cap — a capped kind is skipped even if the recipe wants it', () => {
    // grove is at cap for branch (can't accept more) but still short of stone → carry stone.
    const dest: Stockpile = { branch: STOCKPILE_CAP };
    expect(directedCarry({ branch: 5, stone: 1 }, dest)).toBe('stone');
  });

  it('returns null when the source is empty (nothing to carry)', () => {
    expect(directedCarry({}, {})).toBeNull();
    expect(directedCarry({ branch: 0, stone: 0 }, {})).toBeNull();
  });

  it('breaks a deficit tie deterministically (branch before stone)', () => {
    // a recipe needing equal amounts, dest empty, src has both → RESOURCE_GLYPH order wins.
    const src: Stockpile = { branch: 1, stone: 1 };
    expect(directedCarry(src, {}, { branch: 2, stone: 2 })).toBe('branch');
  });
});
