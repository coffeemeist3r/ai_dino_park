import { describe, it, expect } from 'vitest';
import { spoilFood, spoilFoodOverDays, spoilsAtCap, spoiledLine, SPOIL_MARGIN } from './spoilage';
import { FOOD_STOCKPILE_CAP, type FoodPile } from './foodstore';

describe('spoilsAtCap (BACKLOG-455)', () => {
  it('flags an id at or within SPOIL_MARGIN of cap, never below it or empty', () => {
    const cap = 6;
    expect(spoilsAtCap(6, cap)).toBe(true);
    expect(spoilsAtCap(cap - SPOIL_MARGIN, cap)).toBe(true); // 5
    expect(spoilsAtCap(cap - SPOIL_MARGIN - 1, cap)).toBe(false); // 4 — the floor is safe
    expect(spoilsAtCap(0, cap)).toBe(false);
  });
});

describe('spoilFood (BACKLOG-455)', () => {
  it('bleeds a flat-cap hoard down to the floor (cap-2) and then holds', () => {
    let p: FoodPile = { berries: FOOD_STOCKPILE_CAP }; // 6
    p = spoilFood(p, FOOD_STOCKPILE_CAP);
    expect(p.berries).toBe(5);
    p = spoilFood(p, FOOD_STOCKPILE_CAP);
    expect(p.berries).toBe(4);
    const floor = spoilFood(p, FOOD_STOCKPILE_CAP);
    expect(floor.berries).toBe(4); // self-limits: 4 is below the near-cap band
    expect(floor).toBe(p); // same ref — nothing spoiled
  });

  it('leaves a circulating pile (below the near-cap band) untouched', () => {
    const p = { berries: 4 }; // cap 6 → floor is 4, already there
    expect(spoilFood(p, 6)).toBe(p);
  });

  it('scales the floor with a granary cap (9 → 8 → 7 → hold)', () => {
    let p: FoodPile = { berries: 9 };
    p = spoilFood(p, 9);
    expect(p.berries).toBe(8);
    p = spoilFood(p, 9);
    expect(p.berries).toBe(7);
    expect(spoilFood(p, 9)).toBe(p); // 7 is the floor for cap 9
  });

  it('spoils every id in the near-cap band in one pass, leaving the rest', () => {
    const p = { berries: 6, greens: 6, roots: 3 };
    const next = spoilFood(p, 6);
    expect(next).toEqual({ berries: 5, greens: 5, roots: 3 });
  });

  it('is pure — never mutates the input, and an empty pile stays empty (same ref)', () => {
    const p = { berries: 6 };
    spoilFood(p, 6);
    expect(p.berries).toBe(6); // input untouched
    const empty = {};
    expect(spoilFood(empty, 6)).toBe(empty);
  });
});

describe('spoilFoodOverDays (BACKLOG-462)', () => {
  const cap = FOOD_STOCKPILE_CAP; // 6

  it('a sub-day span (days <= 0) spoils nothing — same ref', () => {
    const p: FoodPile = { berries: cap };
    expect(spoilFoodOverDays(p, 0, cap)).toBe(p);
    expect(spoilFoodOverDays(p, -3, cap)).toBe(p);
  });

  it('bleeds a hoard the elapsed days, settling at the floor and no lower', () => {
    // 3 days: 6→5→4 (the flat-margin floor cap-2 = 4), then holds.
    expect(spoilFoodOverDays({ berries: cap }, 3, cap).berries).toBe(4);
    // A week away can never over-spoil past the self-limiting floor.
    expect(spoilFoodOverDays({ berries: cap }, 7, cap).berries).toBe(4);
  });

  it('matches spoilFood iterated by hand for the same day count', () => {
    let hand: FoodPile = { berries: cap, greens: 6, roots: 3 };
    for (let i = 0; i < 2; i++) hand = spoilFood(hand, cap);
    expect(spoilFoodOverDays({ berries: cap, greens: 6, roots: 3 }, 2, cap)).toEqual(hand);
  });

  it('honours a widened (lean-season) margin — bleeds sooner and deeper over the same days', () => {
    const winterMargin = SPOIL_MARGIN + 1; // 2 — the winter grip
    // Flat margin over 3 days floors at 4; the winter margin floors deeper (cap-margin-1 = 3).
    expect(spoilFoodOverDays({ berries: cap }, 3, cap).berries).toBe(4);
    expect(spoilFoodOverDays({ berries: cap }, 3, cap, winterMargin).berries).toBe(3);
  });

  it('is pure — never mutates the input pile', () => {
    const p: FoodPile = { berries: cap };
    spoilFoodOverDays(p, 5, cap);
    expect(p.berries).toBe(cap);
  });
});

describe('spoiledLine (BACKLOG-455)', () => {
  it('names the zone and food with no double article', () => {
    const line = spoiledLine('The Grove', '🍓');
    expect(line).toContain('The Grove');
    expect(line).toContain('🍓');
    expect(line).toContain('🥀');
    expect(line).not.toContain('the The Grove');
  });
});
