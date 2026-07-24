import { describe, it, expect } from 'vitest';
import {
  canBuildGranary,
  buildGranary,
  granaryFoodCap,
  GRANARY_RECIPE,
  GRANARY_AFTER_STRUCTURES,
  GRANARY_FOOD_BONUS,
} from './granary';
import { FOOD_STOCKPILE_CAP } from './foodstore';

describe('granary gate (BACKLOG-454)', () => {
  const rich = { branch: 3, stone: 3 };

  it('needs enough landmarks, no existing granary, and an affordable pile', () => {
    expect(canBuildGranary(rich, GRANARY_AFTER_STRUCTURES, false)).toBe(true);
  });

  it('is blocked below the landmark bar even with a full pile', () => {
    expect(canBuildGranary(rich, GRANARY_AFTER_STRUCTURES - 1, false)).toBe(false);
  });

  it('is blocked once the zone already has a granary (one per zone)', () => {
    expect(canBuildGranary(rich, GRANARY_AFTER_STRUCTURES + 2, true)).toBe(false);
  });

  it('is blocked when the pile cannot afford the recipe', () => {
    expect(canBuildGranary({ branch: 3, stone: 2 }, GRANARY_AFTER_STRUCTURES, false)).toBe(false);
  });
});

describe('buildGranary spend', () => {
  it('spends exactly the recipe and never mutates the input', () => {
    const pile = { branch: 4, stone: 3, frond: 1 };
    const next = buildGranary(pile);
    expect(next).toEqual({ branch: 4 - (GRANARY_RECIPE.branch ?? 0), stone: 3 - (GRANARY_RECIPE.stone ?? 0), frond: 1 });
    expect(pile).toEqual({ branch: 4, stone: 3, frond: 1 }); // unmutated
  });

  it('returns null when unaffordable', () => {
    expect(buildGranary({ branch: 3, stone: 2 })).toBeNull();
  });
});

describe('granaryFoodCap lift', () => {
  it('lifts the flat cap by the bonus when a granary stands, else the flat cap', () => {
    expect(granaryFoodCap(false)).toBe(FOOD_STOCKPILE_CAP);
    expect(granaryFoodCap(true)).toBe(FOOD_STOCKPILE_CAP + GRANARY_FOOD_BONUS);
  });
});
