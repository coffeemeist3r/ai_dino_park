import { describe, it, expect, afterEach } from 'vitest';
import { rand, seedRandom, isSeeded } from '../../game/src/world/rng';

/**
 * The world's dice (BACKLOG-486, rework). Two properties matter and nothing else does:
 *
 * 1. **Unseeded is untouched.** Production must not change at all — `rand()` has to be `Math.random()`,
 *    including for callers that stub `Math.random` (a great many unit tests do).
 * 2. **Seeded is repeatable.** The same seed gives the same sequence, or the e2e suite is exactly as
 *    uninformative as it was before.
 */

afterEach(() => seedRandom(null));

describe('rng (BACKLOG-486)', () => {
  it('is unseeded by default and delegates straight to Math.random', () => {
    expect(isSeeded()).toBe(false);
    const real = Math.random;
    try {
      Math.random = () => 0.4242;
      expect(rand()).toBe(0.4242);
    } finally {
      Math.random = real;
    }
  });

  it('replays the same sequence from the same seed', () => {
    seedRandom(7);
    const a = [rand(), rand(), rand(), rand()];
    seedRandom(7);
    expect([rand(), rand(), rand(), rand()]).toEqual(a);
  });

  it('gives different seeds different sequences', () => {
    seedRandom(7);
    const a = [rand(), rand(), rand()];
    seedRandom(8);
    expect([rand(), rand(), rand()]).not.toEqual(a);
  });

  it('stays in [0, 1) across a long stretch — the contract every caller assumes', () => {
    seedRandom(20260818);
    for (let i = 0; i < 5000; i++) {
      const v = rand();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('hands the dice back when seeded with null', () => {
    seedRandom(3);
    expect(isSeeded()).toBe(true);
    seedRandom(null);
    expect(isSeeded()).toBe(false);
  });
});
