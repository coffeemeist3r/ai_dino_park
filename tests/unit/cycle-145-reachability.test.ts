/**
 * BACKLOG-501 — the reachability register, walked.
 *
 * This is the test CHARTER v7 has been asking for since it was written. The bar is enforced by a paragraph
 * in a verdict; the standing answers had one bespoke test each and no list. This walks the list.
 *
 * The failure message is the point. A dark entry reports the item and the founding fact, so a tuning pass
 * that turns a system off reads "the park no longer ships X, which is what made Y reachable" rather than
 * `expected false to be true`.
 */

import { describe, it, expect } from 'vitest';
import {
  REACHABILITY_REGISTER,
  darkEntries,
  unplacedRigs,
  worldPlacedProps,
  SESSION_MINUTES,
} from '../../game/src/world/reachability';
import { PROP_RIGS } from '../../game/src/art/propArt';

describe('the reachability register (BACKLOG-501)', () => {
  it('holds — every system the shipping park claims to exercise still is', () => {
    const dark = darkEntries();
    const report = dark.map((e) => `  ${e.id} — ${e.system}\n    was reachable because: ${e.fact}`).join('\n');
    expect(
      dark,
      dark.length
        ? `\nThe founding park no longer exercises ${dark.length} system(s) it claims to:\n${report}\n\n` +
            'Repair the founding state, or remove the entry and say why in the verdict. A claim deleted to ' +
            'make this green is the defect this file exists to catch.'
        : '',
    ).toEqual([]);
  });
});

describe('the register itself', () => {
  it('names an item, a system and a founding fact for every entry', () => {
    for (const e of REACHABILITY_REGISTER) {
      expect(e.id, JSON.stringify(e.id)).toMatch(/^BACKLOG-/);
      expect(e.system.length, e.id).toBeGreaterThan(10);
      expect(e.fact.length, e.id).toBeGreaterThan(10);
    }
  });

  it('lists each claim once', () => {
    const ids = REACHABILITY_REGISTER.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('covers the claims CHARTER v7 and its successors made', () => {
    const ids = REACHABILITY_REGISTER.map((e) => e.id).join(' ');
    for (const item of ['486', '488', '492', '493', '503', '505', '512', '516', '501']) {
      expect(ids, item).toContain(item);
    }
  });

  it('is a walk, not a list of literals — every entry is a callable predicate', () => {
    for (const e of REACHABILITY_REGISTER) expect(typeof e.holds, e.id).toBe('function');
  });
});

describe('the claim nobody had written down — every drawn rig is a rig the park can place', () => {
  it('leaves no rig stashed with no host', () => {
    expect(
      unplacedRigs(),
      'drawn under the cycle-91 stash rule and never planted — the rule has no deadline, so this is it',
    ).toEqual([]);
  });

  it('counts through the production tables rather than a hand-written list', () => {
    const placed = worldPlacedProps();
    // The conventions the scene actually uses: `<landmark>_derelict`, `food_<id>`, `tic_<kind>`, `pile_<n>`.
    expect(placed.has('cairn_derelict')).toBe(true);
    expect(placed.has('food_mushrooms')).toBe(true);
    expect(placed.has('tic_fuss')).toBe(true);
    expect(placed.has('pile_3')).toBe(true);
    // And it is a claim about what can be *shown*, not about what has been drawn: a key with no rig is
    // perfectly allowed to be placeable — that is `NO_RIG_CONTROL`'s graceful fallback, still a live path.
    expect(Object.keys(PROP_RIGS).every((k) => placed.has(k))).toBe(true);
  });
});

describe('the session the clock is measured against', () => {
  it('is long enough to be honest and short enough to mean something', () => {
    expect(SESSION_MINUTES).toBeGreaterThanOrEqual(10); // the bar's own number
    expect(SESSION_MINUTES).toBeLessThanOrEqual(60);
  });
});
