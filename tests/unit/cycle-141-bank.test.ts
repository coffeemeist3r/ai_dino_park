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
  it('is grass on every ground the player can walk to', () => {
    for (const z of zoneChain()) {
      expect(zoneTileAt(z, BANK_TILE.tileX, BANK_TILE.tileY, COLS, ROWS)).toBe('grass');
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

  it('leaves the starting ground bare, so the first gathered stone is a visible event', () => {
    expect(FOUNDING_PILES[BOWL_ID]).toBeUndefined();
    expect(bankStep({})).toBe(0);
    expect(bankStep({ stone: 1 })).toBe(1);
  });
});
