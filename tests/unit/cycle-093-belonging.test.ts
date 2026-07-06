import { describe, it, expect } from 'vitest';
import {
  tenureOf,
  bumpTenure,
  resetTenure,
  isSettled,
  resistsMigration,
  settledLine,
  SETTLE_ROLLS,
  SETTLED_MIGRATE_DAMP,
  type Tenure,
} from '../../game/src/world/belonging';

/**
 * Home-zone belonging (BACKLOG-341) — a dino that resides in one zone long enough settles into it and
 * resists the ambient wander. Milestone 2 lore arc 1.
 */
describe('home-zone belonging (BACKLOG-341)', () => {
  it('tenureOf defaults absent dinos to 0', () => {
    expect(tenureOf({}, 'Rex')).toBe(0);
    expect(tenureOf({ Rex: 3 }, 'Rex')).toBe(3);
  });

  it('bumpTenure adds one roll and is pure (input untouched)', () => {
    const t: Tenure = { Rex: 1 };
    expect(bumpTenure(t, 'Rex')).toEqual({ Rex: 2 });
    expect(bumpTenure(t, 'Glade')).toEqual({ Rex: 1, Glade: 1 });
    expect(t).toEqual({ Rex: 1 }); // pure
  });

  it('resetTenure zeroes a dino and is pure', () => {
    const t: Tenure = { Rex: 5, Glade: 2 };
    expect(resetTenure(t, 'Rex')).toEqual({ Rex: 0, Glade: 2 });
    expect(t).toEqual({ Rex: 5, Glade: 2 }); // pure
  });

  it('isSettled is false below the threshold, true at/above it', () => {
    expect(isSettled(SETTLE_ROLLS - 1)).toBe(false);
    expect(isSettled(SETTLE_ROLLS)).toBe(true);
    expect(isSettled(SETTLE_ROLLS + 3)).toBe(true);
    expect(isSettled(2, 2)).toBe(true); // custom threshold
  });

  it('resistsMigration: only settled dinos ever resist, gated by the damp', () => {
    expect(resistsMigration(false, () => 0)).toBe(false); // unsettled never resists
    expect(resistsMigration(true, () => SETTLED_MIGRATE_DAMP - 0.01)).toBe(true); // below damp → resists
    expect(resistsMigration(true, () => SETTLED_MIGRATE_DAMP + 0.01)).toBe(false); // at/above damp → migrates
  });

  it('settledLine reads the home-zone standing for the book', () => {
    expect(settledLine('The Fernreach')).toBe('at home in The Fernreach');
  });
});
