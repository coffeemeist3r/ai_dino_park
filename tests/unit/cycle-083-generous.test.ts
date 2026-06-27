import { describe, it, expect } from 'vitest';
import {
  yieldFoodTo,
  WELL_FED,
  GENEROUS_BOND,
  HUNGRIER_BY,
} from '../../game/src/world/feeding';

/**
 * Generous feeder (BACKLOG-375) — a well-fed winner beside a hungrier high-bond friend yields the
 * meal. yieldFoodTo decides *who* the winner steps aside for, or null when it eats itself.
 */
describe('generous feeder — yieldFoodTo (BACKLOG-375)', () => {
  const friend = (over: Partial<{ name: string; hunger: number; bond: number }> = {}) => ({
    name: 'Sunny',
    hunger: 0.9,
    bond: GENEROUS_BOND,
    ...over,
  });

  it('a hungry winner keeps its own meal (null even with a worthy friend present)', () => {
    // winner hunger just over the well-fed bar → never yields.
    const r = yieldFoodTo('Rex', WELL_FED + 0.01, [friend()]);
    expect(r).toBeNull();
  });

  it('yields to a well-fed winner standing beside a hungrier high-bond friend', () => {
    expect(yieldFoodTo('Rex', 0.1, [friend()])).toBe('Sunny');
    // exactly at the bars (bond === GENEROUS_BOND, gap === HUNGRIER_BY) still qualifies.
    expect(yieldFoodTo('Rex', 0.2, [friend({ hunger: 0.2 + HUNGRIER_BY, bond: GENEROUS_BOND })])).toBe('Sunny');
  });

  it('does not yield to a low-bond friend (generosity is selective)', () => {
    expect(yieldFoodTo('Rex', 0.1, [friend({ bond: GENEROUS_BOND - 1 })])).toBeNull();
  });

  it('does not yield to a friend who is not meaningfully hungrier', () => {
    // a high-bond friend only a touch hungrier (< HUNGRIER_BY gap) is not worth giving up the meal.
    expect(yieldFoodTo('Rex', 0.2, [friend({ hunger: 0.2 + HUNGRIER_BY - 0.01 })])).toBeNull();
  });

  it('picks the hungriest qualifying friend, ties broken by the higher bond — deterministic', () => {
    const cands = [
      friend({ name: 'A', hunger: 0.7, bond: 90 }),
      friend({ name: 'B', hunger: 0.95, bond: 50 }), // hungriest → wins
      friend({ name: 'C', hunger: 0.95, bond: 80 }), // same hunger as B, higher bond → beats B
    ];
    expect(yieldFoodTo('Rex', 0.1, cands)).toBe('C');
  });

  it('ignores the winner itself in the candidate swarm', () => {
    expect(yieldFoodTo('Rex', 0.1, [friend({ name: 'Rex', hunger: 0.99, bond: 99 })])).toBeNull();
  });

  it('returns null on an empty swarm (no one to yield to → the winner eats)', () => {
    expect(yieldFoodTo('Rex', 0.1, [])).toBeNull();
  });
});
