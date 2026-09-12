import { describe, it, expect } from 'vitest';
import { firstThisSession, spendKey } from '../../game/src/world/session';

/**
 * BACKLOG-545 — the once-a-visit gate.
 *
 * Two functions and one rule: a key is first until it is spent, and spending is idempotent. The
 * idempotence is the half that matters. A browser fires `blur` and then `visibilitychange` for a single
 * alt-tab, and a set whose contents depend on how many events arrived is a set that cannot gate anything.
 */
describe('firstThisSession / spendKey', () => {
  it('a key nobody has spent is first', () => {
    expect(firstThisSession([], 'glance')).toBe(true);
  });

  it('a spent key is not first again', () => {
    expect(firstThisSession(['glance'], 'glance')).toBe(false);
  });

  it('spending records the key', () => {
    expect(spendKey([], 'glance')).toEqual(['glance']);
  });

  it('spending twice adds nothing — the double-fire cannot double-spend', () => {
    expect(spendKey(['glance'], 'glance')).toEqual(['glance']);
  });

  it('does not mutate the caller list', () => {
    const before: string[] = [];
    spendKey(before, 'glance');
    expect(before).toEqual([]);
  });

  it('keys are independent — spending one leaves the other first', () => {
    const spent = spendKey(spendKey([], 'glance'), 'digest');
    expect(spent).toEqual(['glance', 'digest']);
    expect(firstThisSession(spent, 'glance')).toBe(false);
    expect(firstThisSession(spent, 'wave')).toBe(true);
  });
});
