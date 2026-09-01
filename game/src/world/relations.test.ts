import { describe, it, expect } from 'vitest';
import { RELATION_REGISTER, brokenRelations } from './relations';

describe('the relation register (BACKLOG-521)', () => {
  it('holds every claim the park’s constants make about each other', () => {
    const broken = brokenRelations();
    expect(
      broken.map((e) => `${e.id}: ${e.claim}`),
      'a relation has gone false — repair it, do not delete the entry',
    ).toEqual([]);
  });

  it('registers at least the eight relations the sweep found', () => {
    // A guard against the one repair this file must never accept: shrinking the register to make it green.
    expect(RELATION_REGISTER.length).toBeGreaterThanOrEqual(8);
  });

  it('gives every entry an id and a claim in words', () => {
    for (const e of RELATION_REGISTER) {
      expect(e.id).toMatch(/^BACKLOG-/);
      expect(e.claim.length).toBeGreaterThan(20);
      expect(typeof e.holds()).toBe('boolean');
    }
  });
});
