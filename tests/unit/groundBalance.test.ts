import { describe, expect, it } from 'vitest';
import { ACTIVE_SCALE, MINUTES_PER_DAY, WANDER_STEP_MS } from '../../game/src/world/clock';
import { YIELD_DEPLETE, YIELD_REGROW } from '../../game/src/world/regrowth';
import { STRUCTURES_PER_UPKEEP, upkeepDue } from '../../game/src/world/upkeep';
import { FOUNDING_LANDMARKS } from '../../game/src/world/founding';
import {
  affordableSkyline,
  dailyRolls,
  groundBalance,
  inflowCeiling,
  solvent,
  ticksPerGather,
} from '../../game/src/world/groundBalance';

/**
 * BACKLOG-536. Every expectation here is recomputed from the imported constants rather than typed as a
 * literal, which is the point of the item: a tuning pass that moves `WANDER_STEP_MS`, `ACTIVE_SCALE` or
 * either yield constant should move these numbers *and stay green*, and should redden only the claims that
 * are actually about the relationship between them.
 */
describe('groundBalance derivation (BACKLOG-536)', () => {
  it('derives the daily roll count from the pump and the day length', () => {
    expect(dailyRolls()).toBe(((MINUTES_PER_DAY / ACTIVE_SCALE) * 60_000) / WANDER_STEP_MS);
  });

  it('derives the gather cadence from the yield economics, not the spawn chance', () => {
    expect(ticksPerGather()).toBeCloseTo(YIELD_DEPLETE / YIELD_REGROW, 10);
  });

  it('the ceiling is the rolls a ground can actually cash, not the rolls it gets', () => {
    expect(inflowCeiling()).toBeCloseTo(dailyRolls() / ticksPerGather(), 10);
    expect(inflowCeiling()).toBeLessThan(dailyRolls()); // the yield binds, which is the finding
  });

  it('calls upkeepDue for the outflow rather than re-deriving the bill', () => {
    for (let standing = 0; standing <= 8; standing++) {
      expect(groundBalance(standing).outflow).toBe(upkeepDue(standing));
    }
  });

  it('surplus is inflow less outflow', () => {
    const b = groundBalance(4);
    expect(b.surplus).toBeCloseTo(b.inflow - b.outflow, 10);
  });
});

describe('solvency (BACKLOG-536)', () => {
  it('every founding ground can pay for its founding skyline', () => {
    const byZone: Record<string, number> = {};
    for (const l of FOUNDING_LANDMARKS) byZone[l.zone] = (byZone[l.zone] ?? 0) + 1;
    for (const [zone, standing] of Object.entries(byZone)) {
      expect(solvent(standing), `${zone} at ${standing} standing`).toBe(true);
    }
  });

  it('and can still pay for it once the founding ruin has been mended', () => {
    // BACKLOG-528: the Grove keeps two after the first-minute mend, which is the skyline that is actually
    // billed on a played save. This is the number the item was really asking about.
    expect(solvent(2)).toBe(true);
    expect(groundBalance(2).outflow).toBe(1); // it *is* billed — the bar's whole point
  });

  it('states the headroom, because that number is this item output', () => {
    const played = groundBalance(2);
    // Not an assertion about a magic ratio — an assertion that the margin is wide rather than marginal,
    // which is what makes "converges" true rather than lucky.
    expect(played.inflow / Math.max(1, played.outflow)).toBeGreaterThan(10);
  });

  it('the predicate can actually fail, which is what makes it a claim and not a comment', () => {
    const tooMany = Math.ceil((inflowCeiling() + 1) * STRUCTURES_PER_UPKEEP);
    expect(solvent(tooMany)).toBe(false);
    expect(groundBalance(tooMany).surplus).toBeLessThan(0);
  });

  it('affordableSkyline is the boundary — solvent at it, insolvent one past it', () => {
    const n = affordableSkyline();
    expect(solvent(n)).toBe(true);
    expect(solvent(n + 1)).toBe(false);
  });
});
