import { describe, it, expect } from 'vitest';
import { BANK_TILE, PILE_STEPS, bankStep, pileArtKey, pileStep } from '../../game/src/world/bank';
import { pileTotal, STOCKPILE_CAP, STOCKPILE_SOFT_CAP } from '../../game/src/world/resource';
import { zoneChain, zoneTileAt, GROVE_ID, BOWL_ID } from '../../game/src/world/zones';
import { FOUNDING_PILES, FOUNDING_RUIN } from '../../game/src/world/founding';
import { REPAIR_COST } from '../../game/src/world/upkeep';

const COLS = 20;
const ROWS = 15;

describe('the heap step (BACKLOG-504)', () => {
  it('steps with the banked total', () => {
    expect(pileStep(0)).toBe(0);
    expect(pileStep(1)).toBe(1);
    expect(pileStep(2)).toBe(2);
    expect(pileStep(3)).toBe(2);
    expect(pileStep(4)).toBe(3);
    expect(pileStep(STOCKPILE_CAP * 3)).toBe(3); // never climbs past the last step
  });

  it('reads a pile directly', () => {
    expect(bankStep({})).toBe(0);
    expect(bankStep({ stone: 2 })).toBe(2);
    expect(bankStep({ stone: 2, branch: 2 })).toBe(3);
  });

  it('names a prop key per step, and nothing at all when the ground is bare', () => {
    expect(pileArtKey(0)).toBeNull();
    expect(pileArtKey(1)).toBe('pile_1');
    expect(pileArtKey(2)).toBe('pile_2');
    expect(pileArtKey(3)).toBe('pile_3');
  });

  it('reaches its full heap below the soft cap — a well-gathered ground is not stuck one short', () => {
    expect(PILE_STEPS[2]).toBeLessThanOrEqual(STOCKPILE_SOFT_CAP);
  });
});

describe('the bank tile', () => {
  /**
   * The invariant, not a comment. The bank sits on the same tile on every ground so the player learns one
   * place; if a later terrain pass grows a pond or a trail over it, this fails rather than the heap quietly
   * floating on water.
   */
  it('is never underwater on any ground the player can walk to', () => {
    // This asked for grass until BACKLOG-505, when the sixth ground turned out to be bare crust from its
    // third column east — and a heap of gathered stone sitting on crust is fine. What was never fine, and
    // what this test was actually written to catch, is a later terrain edit growing a pond over the tile
    // and drowning the heap. That is the assertion now, on every ground, and it is the same one the hatch
    // (BACKLOG-510) makes about its own tile for the same reason.
    for (const z of zoneChain()) {
      expect(zoneTileAt(z, BANK_TILE.tileX, BANK_TILE.tileY, COLS, ROWS), z).not.toBe('water');
    }
  });

  it('is clear of the fixtures the park already pins in place', () => {
    const taken = [
      { tileX: 10, tileY: 11 }, // the bowl's huddle tile
      { tileX: 2, tileY: 12 }, // the bowl's plot
      { tileX: FOUNDING_RUIN.tileX, tileY: FOUNDING_RUIN.tileY }, // the founding ruin
    ];
    for (const t of taken) {
      expect({ tileX: BANK_TILE.tileX, tileY: BANK_TILE.tileY }).not.toEqual(t);
    }
  });
});

describe('the founding heap (CHARTER v7 reachability)', () => {
  /**
   * The twin of cycle 136's founding pin. 504's whole claim is that a brand-new player sees a heap on the
   * ground and then watches it lose a step when somebody spends it. Both halves are constants, and both can
   * be tuned away silently by a later pass — so they are pinned here.
   */
  it('ships a visible heap on the ground with the ruin', () => {
    expect(bankStep(FOUNDING_PILES[FOUNDING_RUIN.zone])).toBeGreaterThanOrEqual(1);
  });

  it('drops a step when the founding mend is paid for', () => {
    const before = pileTotal(FOUNDING_PILES[GROVE_ID]);
    expect(pileStep(before - REPAIR_COST)).toBeLessThan(pileStep(before));
  });

  /**
   * **Amended cycle 151 (BACKLOG-495).** This read "leaves the starting ground bare", and its stated
   * reason was that the first gathered stone should be a *visible event*. The bare bowl was one way to buy
   * that, and it cost the park two of the three heap rigs on a fresh save — `pile_3` had never once
   * existed on a first frame. The bowl now boots at step 1, and the reason the old test gave is **still
   * satisfied**: one gathered unit takes the starting ground from step 1 to step 2, which is exactly as
   * visible as 0 to 1 was. The claim is kept; the way of paying for it is not.
   */
  it('leaves room on the starting ground for the first gathered unit to show', () => {
    const bowl = FOUNDING_PILES[BOWL_ID];
    expect(bowl).toBeDefined();
    const before = pileTotal(bowl);
    expect(pileStep(before + 1)).toBeGreaterThan(pileStep(before));
    expect(bankStep({})).toBe(0);
    expect(bankStep({ stone: 1 })).toBe(1);
  });
});
