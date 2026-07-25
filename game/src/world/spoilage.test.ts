import { describe, it, expect } from 'vitest';
import { spoilFood, spoilsAtCap, spoiledLine, SPOIL_MARGIN } from './spoilage';
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

describe('spoiledLine (BACKLOG-455)', () => {
  it('names the zone and food with no double article', () => {
    const line = spoiledLine('The Grove', '🍓');
    expect(line).toContain('The Grove');
    expect(line).toContain('🍓');
    expect(line).toContain('🥀');
    expect(line).not.toContain('the The Grove');
  });
});
