import { describe, it, expect } from 'vitest';
import { FOUNDING_RUIN, FOUNDING_PILES } from '../../game/src/world/founding';
import { zoneChain, zoneTileAt, zoneById } from '../../game/src/world/zones';
import { pileTotal } from '../../game/src/world/resource';
import { upkeepDue, REPAIR_COST } from '../../game/src/world/upkeep';
import { ROSTER } from '../../game/src/entities/roster';

const COLS = 20;
const ROWS = 15;

/**
 * The founding state (CHARTER v7). These are the reachability pins: every one of them, if it broke, would
 * make the founding beat unobservable again *without turning a single other test red* — which is exactly
 * how the park spent seven cycles shipping a governance system nobody could reach.
 */
describe('the founding ruin', () => {
  it('sits on a real ground', () => {
    expect(zoneChain()).toContain(FOUNDING_RUIN.zone);
    expect(zoneById(FOUNDING_RUIN.zone).name).toBeTruthy();
  });

  it('is on walkable ground, not in the pond', () => {
    const kind = zoneTileAt(FOUNDING_RUIN.zone, FOUNDING_RUIN.tileX, FOUNDING_RUIN.tileY, COLS, ROWS);
    expect(kind).not.toBe('water');
  });

  it('is inside the map', () => {
    expect(FOUNDING_RUIN.tileX).toBeGreaterThanOrEqual(0);
    expect(FOUNDING_RUIN.tileX).toBeLessThan(COLS);
    expect(FOUNDING_RUIN.tileY).toBeGreaterThanOrEqual(0);
    expect(FOUNDING_RUIN.tileY).toBeLessThan(ROWS);
  });

  /** A ruin on an empty ground is a ruin forever — the mend needs hands that already live there. */
  it('sits on a ground the founding cast lives on', () => {
    const residents = ROSTER.filter((r) => (r.zone ?? 'bowl') === FOUNDING_RUIN.zone);
    expect(residents.length).toBeGreaterThan(0);
  });

  /** 480s rule, re-asserted here because the founding state now depends on it: a ruin bills nothing. */
  it('costs its ground no upkeep — the founding park still owes nothing', () => {
    expect(upkeepDue(0)).toBe(0);
  });
});

describe('the founding pile', () => {
  /**
   * **The reachability pin.** If a later tuning pass drops the founding pile below what a mend costs, the
   * ruin becomes permanent scenery and the whole 480/485/488 arc goes dormant on every save a new player
   * will ever open — silently, with every other spec still green. This test is the thing that says so.
   */
  it('can afford the patch-up the founding ruin asks for', () => {
    const pile = FOUNDING_PILES[FOUNDING_RUIN.zone];
    expect(pile).toBeDefined();
    expect(pileTotal(pile)).toBeGreaterThanOrEqual(REPAIR_COST);
  });

  /**
   * **Amended cycle 151 (BACKLOG-495).** This read "stocks only the ground with the ruin", and that was
   * the right pin for cycle 136, when the founding pile existed to make one ruin mendable. It stopped
   * being right when BACKLOG-504 drew a heap in three steps: one stocked ground means a fresh park
   * exercises one of the three rigs, which is CHARTER v7's corollary — a constant tuned to sit under the
   * thing it feeds. The founding piles now reach each drawn step once, and `cycle-151-founding-piles.test.ts`
   * pins that coverage.
   *
   * What survives here is the half of the claim that was never about the ruin: **the founding park is not
   * made rich.** Every ground stays modest, and the frontier stays bare.
   */
  it('stays modest — no founding ground is stocked past a couple of units', () => {
    for (const pile of Object.values(FOUNDING_PILES)) {
      expect(pileTotal(pile)).toBeGreaterThan(0);
      expect(pileTotal(pile)).toBeLessThanOrEqual(4);
    }
    expect(FOUNDING_PILES[FOUNDING_RUIN.zone]).toBeDefined();
  });
});
