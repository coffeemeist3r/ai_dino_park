import { describe, it, expect } from 'vitest';
import {
  bankFood,
  foodAtCap,
  foodPileTotal,
  foodPileLine,
  pickFoodCarry,
  courierMemory,
  courierLine,
  FOOD_STOCKPILE_CAP,
  type FoodPile,
} from './foodstore';

describe('food stockpile (BACKLOG-446)', () => {
  it('banks a harvested unit by food id', () => {
    expect(bankFood({}, 'berries')).toEqual({ berries: 1 });
    expect(bankFood({ berries: 1 }, 'berries')).toEqual({ berries: 2 });
    expect(bankFood({ berries: 1 }, 'greens')).toEqual({ berries: 1, greens: 1 });
  });

  it('does not mutate the input pile', () => {
    const pile: FoodPile = { berries: 1 };
    const next = bankFood(pile, 'berries');
    expect(pile).toEqual({ berries: 1 }); // unchanged
    expect(next).toEqual({ berries: 2 });
  });

  it('clamps at the per-id cap (banking at cap stalls)', () => {
    const full: FoodPile = { berries: FOOD_STOCKPILE_CAP };
    expect(foodAtCap(full, 'berries')).toBe(true);
    expect(bankFood(full, 'berries')).toBe(full); // unchanged reference — no-op
  });

  it('totals across ids', () => {
    expect(foodPileTotal({})).toBe(0);
    expect(foodPileTotal({ berries: 2, greens: 3 })).toBe(5);
  });

  it('reads a stable glyph line in FOODS order, empty → ""', () => {
    expect(foodPileLine({})).toBe('');
    // FOODS order is meat, greens, fish, berries, roots — greens before berries regardless of insert order.
    expect(foodPileLine({ berries: 2, greens: 1 })).toBe('🌿 1 · 🍓 2');
  });
});

describe('food flows between zones (BACKLOG-447)', () => {
  it('ferries the most-stocked id the dest is lighter on (glut → lighter fallback)', () => {
    expect(pickFoodCarry({ berries: 3, greens: 1 }, {})).toBe('berries');
    // dest already holds more berries than src → not that id; greens still flows (dest 0 < src 1).
    expect(pickFoodCarry({ berries: 1, greens: 1 }, { berries: 5 })).toBe('greens');
  });

  it('prefers the wanted id (438 demand) when src has it and dest is lighter', () => {
    // src most-stocked is berries, but dest *wants* greens → the demand read wins.
    expect(pickFoodCarry({ berries: 3, greens: 1 }, {}, 'greens')).toBe('greens');
    // want not banked in src → fall back to the glut pick.
    expect(pickFoodCarry({ berries: 3 }, {}, 'greens')).toBe('berries');
    // want present but dest not lighter on it → fall back (no ping-pong into a fuller zone).
    expect(pickFoodCarry({ berries: 3, greens: 1 }, { greens: 2 }, 'greens')).toBe('berries');
  });

  it('moves nothing toward an equal-or-fuller / capped / empty source', () => {
    expect(pickFoodCarry({}, {})).toBeNull(); // src empty
    expect(pickFoodCarry({ berries: 2 }, { berries: 2 })).toBeNull(); // dest not strictly lighter
    expect(pickFoodCarry({ berries: 3 }, { berries: FOOD_STOCKPILE_CAP })).toBeNull(); // dest capped
  });

  it('is pure and deterministic (no mutation, FOODS-order tie-break)', () => {
    const src: FoodPile = { berries: 2, greens: 2 };
    const dest: FoodPile = {};
    expect(pickFoodCarry(src, dest)).toBe('greens'); // greens precedes berries in FOODS order on a count tie
    expect(src).toEqual({ berries: 2, greens: 2 }); // unchanged
    expect(dest).toEqual({}); // unchanged
  });
});

describe("the courier's pride (BACKLOG-451)", () => {
  it('names the food emoji and dest zone in the memory', () => {
    expect(courierMemory('The Grove', '🍓')).toBe('you carried 🍓 to The Grove when its stores ran short');
  });
  it('shows the 📦 pride bubble', () => {
    expect(courierLine()).toBe('📦');
  });
});
