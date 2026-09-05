import { describe, it, expect } from 'vitest';
import { FOUNDING_PILES, FOUNDING_PILE_STEPS } from '../../game/src/world/founding';
import { BOWL_ID, GROVE_ID, HOLLOW_ID, RIDGE_ID, SALTPAN_ID } from '../../game/src/world/zones';
import { PILE_STEPS, bankStep } from '../../game/src/world/bank';
import { pileTotal, STOCKPILE_SOFT_CAP } from '../../game/src/world/resource';
import { REPAIR_COST } from '../../game/src/world/upkeep';
import { quarryKind } from '../../game/src/world/quarry';
import { REACHABILITY_REGISTER, darkEntries } from '../../game/src/world/reachability';

/**
 * BACKLOG-495's reachable half: the founding piles now reach every drawn heap step.
 *
 * BACKLOG-504 draws the ground's banked heap in three steps and, until cycle 151, exactly one ground on a
 * fresh save had anything in its pile — so a new park exercised one of the three rigs and `pile_3` had
 * never existed on a first frame. These are the pins that keep a later tuning pass from quietly putting it
 * back the way it was.
 */
describe('founding piles reach every drawn heap step (BACKLOG-495/504)', () => {
  it('stocks each drawn step exactly once', () => {
    const steps = Object.values(FOUNDING_PILE_STEPS);
    expect(new Set(steps)).toEqual(new Set([1, 2, 3]));
    expect(steps).toHaveLength(PILE_STEPS.length);
  });

  it('derives its steps rather than restating them', () => {
    for (const [zone, pile] of Object.entries(FOUNDING_PILES)) {
      expect(FOUNDING_PILE_STEPS[zone]).toBe(bankStep(pile));
    }
  });

  it('stocks the bowl, the grove and the ridge', () => {
    expect(Object.keys(FOUNDING_PILES).sort()).toEqual([BOWL_ID, GROVE_ID, RIDGE_ID].sort());
  });

  it('leaves the frontier bare, so the unsettled badge still means nobody has been there', () => {
    expect(FOUNDING_PILES[SALTPAN_ID]).toBeUndefined();
    expect(FOUNDING_PILES[HOLLOW_ID]).toBeUndefined();
  });

  it('leaves the mend beat unchanged — the Grove still covers a repair', () => {
    expect(pileTotal(FOUNDING_PILES[GROVE_ID])).toBeGreaterThanOrEqual(REPAIR_COST);
  });

  it('keeps every founding ground under the soft cap', () => {
    for (const pile of Object.values(FOUNDING_PILES)) {
      expect(pileTotal(pile)).toBeLessThan(STOCKPILE_SOFT_CAP);
    }
  });

  it("stocks the Ridge with the Ridge's own exclusive kind", () => {
    const kind = quarryKind();
    expect(kind).toBeTruthy();
    expect(FOUNDING_PILES[RIDGE_ID][kind as keyof (typeof FOUNDING_PILES)[string]]).toBeGreaterThan(0);
  });

  it('carries its claim in the register, and the register is not dark', () => {
    expect(REACHABILITY_REGISTER.map((e) => e.id)).toContain('BACKLOG-495/504');
    expect(darkEntries().map((e) => e.id)).toEqual([]);
  });
});
