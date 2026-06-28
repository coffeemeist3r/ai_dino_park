import { describe, it, expect } from 'vitest';
import {
  gobblesFood,
  gobblerAmong,
  GOBBLE_HUNGER,
  GREEDY_AGREE,
  HUNGRIER_BY,
} from '../../game/src/world/feeding';

/**
 * Greedy gobble (BACKLOG-387) — the inverse of yieldFoodTo. A hungry, prickly dino shoulders past the
 * winner to a kept drop; a warm or sated dino waits its turn. Pure decisions, unit-pinned here.
 */

describe('gobblesFood (BACKLOG-387)', () => {
  it('is true only when hungry enough AND prickly enough', () => {
    expect(gobblesFood(GOBBLE_HUNGER, GREEDY_AGREE)).toBe(true); // exactly on both bars
    expect(gobblesFood(0.9, 0.1)).toBe(true);
  });

  it('is false when not hungry enough', () => {
    expect(gobblesFood(GOBBLE_HUNGER - 0.01, 0.1)).toBe(false);
  });

  it('is false when too warm (high agreeableness waits its turn)', () => {
    expect(gobblesFood(0.9, GREEDY_AGREE + 0.01)).toBe(false);
  });
});

describe('gobblerAmong (BACKLOG-387)', () => {
  const winner = 'Rex';
  const wHunger = 0.4; // hungry enough that the winner keeps its food (no 375 yield), but mild

  it('returns a hungry prickly dino sufficiently hungrier than the winner', () => {
    const out = gobblerAmong(winner, wHunger, [{ name: 'Twitch', hunger: 0.9, agreeableness: 0.1 }]);
    expect(out).toBe('Twitch');
  });

  it('excludes the winner itself even if it would qualify', () => {
    expect(gobblerAmong(winner, 0.9, [{ name: winner, hunger: 0.9, agreeableness: 0.1 }])).toBeNull();
  });

  it('requires the gobbler be at least HUNGRIER_BY hungrier than the winner', () => {
    const justUnder = wHunger + HUNGRIER_BY - 0.01;
    expect(gobblerAmong(winner, wHunger, [{ name: 'Twitch', hunger: justUnder, agreeableness: 0.1 }])).toBeNull();
    const justOver = wHunger + HUNGRIER_BY;
    expect(gobblerAmong(winner, wHunger, [{ name: 'Twitch', hunger: justOver, agreeableness: 0.1 }])).toBe('Twitch');
  });

  it('ignores a warm dino no matter how hungry', () => {
    expect(gobblerAmong(winner, wHunger, [{ name: 'Sunny', hunger: 1.0, agreeableness: 0.9 }])).toBeNull();
  });

  it('picks the hungriest qualifying gobbler, ties broken toward the pricklier', () => {
    const out = gobblerAmong(winner, wHunger, [
      { name: 'A', hunger: 0.8, agreeableness: 0.2 },
      { name: 'B', hunger: 0.95, agreeableness: 0.3 }, // hungriest → wins
      { name: 'C', hunger: 0.95, agreeableness: 0.1 }, // ties B on hunger but listed after; pricklier
    ]);
    // B and C tie on hunger 0.95; the tie-break favours the lower agreeableness → C.
    expect(out).toBe('C');
  });

  it('returns null when no candidate qualifies', () => {
    expect(gobblerAmong(winner, wHunger, [{ name: 'Sunny', hunger: 0.45, agreeableness: 0.8 }])).toBeNull();
  });
});
