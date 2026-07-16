import { describe, it, expect } from 'vitest';
import { bankFood, foodAtCap, foodPileTotal, foodPileLine, FOOD_STOCKPILE_CAP, type FoodPile } from './foodstore';

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
