import { describe, it, expect } from 'vitest';
import {
  reactionToFood,
  feedStep,
  reachedFood,
  foodLanding,
  FEED_RANGE,
  FEED_RANGE_FAV,
} from '../../game/src/world/feeding';

describe('reactionToFood', () => {
  it('ignores food beyond range regardless of energy', () => {
    expect(reactionToFood(0.0, FEED_RANGE + 1)).toBe('ignore');
    expect(reactionToFood(1.0, FEED_RANGE + 1)).toBe('ignore');
  });

  it('the energetic rush, the calm shrug (in range)', () => {
    expect(reactionToFood(0.9, 2)).toBe('rush');
    expect(reactionToFood(0.1, 2)).toBe('ignore');
  });

  it('rushes at the eagerness threshold', () => {
    expect(reactionToFood(0.4, FEED_RANGE)).toBe('rush');
  });

  // BACKLOG-061: a favorite pulls harder. isFavorite must only ever ADD rushers,
  // so the 2-arg (generic) calls above are unchanged.
  it('a calm dino ignores generic food but rushes its favorite', () => {
    expect(reactionToFood(0.2, 2)).toBe('ignore'); // below the normal EAGER bar
    expect(reactionToFood(0.2, 2, true)).toBe('rush'); // favorite rouses it
  });

  it('a far dino ignores generic food but crosses the bowl for its favorite', () => {
    const far = FEED_RANGE + 2; // beyond generic range, within FEED_RANGE_FAV
    expect(far).toBeLessThanOrEqual(FEED_RANGE_FAV);
    expect(reactionToFood(0.9, far)).toBe('ignore');
    expect(reactionToFood(0.9, far, true)).toBe('rush');
  });

  it('even a favorite has a limit — beyond FEED_RANGE_FAV it is ignored', () => {
    expect(reactionToFood(1.0, FEED_RANGE_FAV + 1, true)).toBe('ignore');
  });
});

describe('feedStep', () => {
  it('steps one tile toward the food, shrinking the distance', () => {
    const from = { tileX: 2, tileY: 2 };
    const food = { tileX: 10, tileY: 2 };
    const next = feedStep(from, food, 20, 15);
    expect(next).toEqual({ tileX: 3, tileY: 2 });
    const before = Math.abs(from.tileX - food.tileX) + Math.abs(from.tileY - food.tileY);
    const after = Math.abs(next.tileX - food.tileX) + Math.abs(next.tileY - food.tileY);
    expect(after).toBeLessThan(before);
  });
});

describe('reachedFood', () => {
  it('is true on the same tile and any adjacent tile', () => {
    expect(reachedFood({ tileX: 5, tileY: 5 }, { tileX: 5, tileY: 5 })).toBe(true);
    expect(reachedFood({ tileX: 6, tileY: 5 }, { tileX: 5, tileY: 5 })).toBe(true);
    expect(reachedFood({ tileX: 6, tileY: 6 }, { tileX: 5, tileY: 5 })).toBe(true);
  });

  it('is false two tiles away', () => {
    expect(reachedFood({ tileX: 7, tileY: 5 }, { tileX: 5, tileY: 5 })).toBe(false);
  });
});

describe('foodLanding', () => {
  it('honors and clamps an explicit hatch column', () => {
    expect(foodLanding(20, 15, 3).tileX).toBe(3);
    expect(foodLanding(20, 15, -3).tileX).toBe(0);
    expect(foodLanding(20, 15, 999).tileX).toBe(19);
  });

  it('picks a column from rand when none is given', () => {
    expect(foodLanding(20, 15, undefined, () => 0.5).tileX).toBe(10);
    expect(foodLanding(20, 15, undefined, () => 0).tileX).toBe(0);
  });

  it('always settles in the upper-middle feeding zone', () => {
    expect(foodLanding(20, 15, 3).tileY).toBe(Math.floor(15 * 0.45));
    expect(foodLanding(20, 15, undefined, () => 0.9).tileY).toBe(Math.floor(15 * 0.45));
  });
});
