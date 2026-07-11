import { describe, it, expect } from 'vitest';
import {
  yieldFoodTo,
  GENEROUS_BOND,
  HUNGRIER_BY,
  RECIPROCAL_BOND,
  RECIPROCAL_HUNGRIER_BY,
} from '../../game/src/world/feeding';

/**
 * Remembered generosity (BACKLOG-385) — a well-fed winner repays a friend it remembers being fed by
 * (the `owes` set) at a relaxed bond bar, and prefers that benefactor on a tie. With an empty ledger,
 * `yieldFoodTo` is byte-identical to the cycle-83 generous feeder.
 */
describe('reciprocal yield (BACKLOG-385)', () => {
  const winnerHunger = 0.1; // well-fed

  it('the reciprocal bars are looser than the stranger-friend bars', () => {
    expect(RECIPROCAL_BOND).toBeLessThan(GENEROUS_BOND);
    expect(RECIPROCAL_HUNGRIER_BY).toBeLessThan(HUNGRIER_BY);
  });

  it('yields to an owed benefactor at a bond below GENEROUS_BOND that a stranger-friend would fail', () => {
    const bond = Math.floor((RECIPROCAL_BOND + GENEROUS_BOND) / 2); // e.g. 30 — over reciprocal, under generous
    const cands = [{ name: 'A', hunger: 0.9, bond }];
    // un-owed → the generous bar (40) is not met → no yield
    expect(yieldFoodTo('B', winnerHunger, cands)).toBeNull();
    // owed → the reciprocal bar (20) is met → B repays A
    expect(yieldFoodTo('B', winnerHunger, cands, new Set(['A']))).toBe('A');
  });

  it('prefers an owed benefactor over an equally-hungry un-owed friend (owed-first tiebreak)', () => {
    const cands = [
      { name: 'Stranger', hunger: 0.9, bond: 90 }, // higher bond, but not owed
      { name: 'Benefactor', hunger: 0.9, bond: 45 }, // owed — should win the tie
    ];
    expect(yieldFoodTo('B', winnerHunger, cands, new Set(['Benefactor']))).toBe('Benefactor');
    // without the ledger, the plain rule wins: same hunger → higher bond → Stranger
    expect(yieldFoodTo('B', winnerHunger, cands)).toBe('Stranger');
  });

  it('an empty ledger reproduces the cycle-83 verdict exactly (regression pin)', () => {
    const cands = [
      { name: 'Near', hunger: 0.5, bond: 50 }, // clears both generous bars
      { name: 'Faint', hunger: 0.3, bond: 80 }, // hunger gap 0.2 < HUNGRIER_BY → out
    ];
    expect(yieldFoodTo('W', winnerHunger, cands, new Set())).toBe('Near');
    expect(yieldFoodTo('W', winnerHunger, cands)).toBe('Near');
    // a hungry winner never yields, ledger or not
    expect(yieldFoodTo('W', 0.9, cands, new Set(['Near']))).toBeNull();
  });

  it('an owed benefactor still needs SOME hunger gap (RECIPROCAL_HUNGRIER_BY)', () => {
    const cands = [{ name: 'A', hunger: winnerHunger + RECIPROCAL_HUNGRIER_BY / 2, bond: 90 }];
    expect(yieldFoodTo('B', winnerHunger, cands, new Set(['A']))).toBeNull(); // gap too small even when owed
  });
});
