import { describe, it, expect } from 'vitest';
import {
  upkeepDue,
  runUpkeep,
  runUpkeepOverDays,
  lapsedLine,
  patchedLine,
  STRUCTURES_PER_UPKEEP,
  REPAIR_COST,
} from './upkeep';
import type { Stockpile } from './resource';

const total = (p: Stockpile) => Object.values(p).reduce((a, b) => a + (b ?? 0), 0);

describe('upkeepDue', () => {
  it('leaves a one-landmark ground free and scales a unit per pair', () => {
    expect(upkeepDue(0)).toBe(0);
    expect(upkeepDue(1)).toBe(0);
    expect(upkeepDue(2)).toBe(1);
    expect(upkeepDue(3)).toBe(1);
    expect(upkeepDue(4)).toBe(2);
    expect(upkeepDue(5)).toBe(2);
    expect(STRUCTURES_PER_UPKEEP).toBe(2);
  });
});

describe('runUpkeep', () => {
  it('pays the bill in full from a pile that covers it', () => {
    const plan = runUpkeep({ branch: 3, stone: 3 }, 4, 0);
    expect(plan.paid).toBe(2);
    expect(plan.lapsed).toBe(0);
    expect(total(plan.pile)).toBe(4);
  });

  it('drains the largest kind first, so a scarce kind is not emptied', () => {
    const plan = runUpkeep({ branch: 1, stone: 4 }, 4, 0);
    expect(plan.pile).toEqual({ branch: 1, stone: 2 });
  });

  it('lapses a landmark per unpaid unit and never goes negative', () => {
    const plan = runUpkeep({}, 4, 0);
    expect(plan).toMatchObject({ paid: 0, lapsed: 2, repaired: 0 });
    expect(total(plan.pile)).toBe(0);
  });

  it('pays what it can and lapses the remainder', () => {
    const plan = runUpkeep({ stone: 1 }, 4, 0);
    expect(plan).toMatchObject({ paid: 1, lapsed: 1 });
    expect(total(plan.pile)).toBe(0);
  });

  it('cannot lapse more landmarks than are standing', () => {
    expect(runUpkeep({}, 2, 0).lapsed).toBe(1);
    expect(runUpkeep({}, 0, 3).lapsed).toBe(0);
  });

  it('converges instead of cascading — a lapsed ground owes less next pass', () => {
    // Four standing, empty pile: two lapse, leaving two standing (bill 1), then one lapses, leaving one
    // standing (bill 0). It settles on a skyline the ground can afford rather than falling to zero.
    let standing = 4;
    let derelict = 0;
    for (let day = 0; day < 5; day++) {
      const plan = runUpkeep({}, standing, derelict);
      standing -= plan.lapsed;
      derelict += plan.lapsed;
    }
    expect(standing).toBe(1);
    expect(derelict).toBe(3);
  });

  it('patches one derelict back up when the bill is met and a unit is spare', () => {
    const plan = runUpkeep({ stone: 5 }, 2, 2);
    expect(plan.repaired).toBe(1);
    expect(plan.paid).toBe(1 + REPAIR_COST);
  });

  it('patches nothing with no derelict, no spare, or an unpaid bill', () => {
    expect(runUpkeep({ stone: 5 }, 2, 0).repaired).toBe(0);
    expect(runUpkeep({ stone: 1 }, 2, 1).repaired).toBe(0); // the one unit went on the bill
    expect(runUpkeep({}, 4, 1).repaired).toBe(0);
  });

  it('returns the same pile reference when nothing happens at all', () => {
    const pile: Stockpile = { stone: 2 };
    expect(runUpkeep(pile, 1, 0).pile).toBe(pile);
    expect(runUpkeep(pile, 0, 0).pile).toBe(pile);
  });
});

describe('runUpkeepOverDays', () => {
  it('equals the same number of sequential live passes', () => {
    const start: Stockpile = { branch: 2, stone: 3 };
    let live: Stockpile = start;
    let standing = 4;
    let derelict = 0;
    for (let i = 0; i < 3; i++) {
      const plan = runUpkeep(live, standing, derelict);
      live = plan.pile;
      standing = standing - plan.lapsed + plan.repaired;
      derelict = derelict + plan.lapsed - plan.repaired;
    }
    expect(runUpkeepOverDays(start, 3, 4, 0).pile).toEqual(live);
  });

  it('is a no-op for zero or negative days', () => {
    const pile: Stockpile = { stone: 2 };
    expect(runUpkeepOverDays(pile, 0, 4, 0)).toMatchObject({ pile, paid: 0, lapsed: 0, repaired: 0 });
  });

  it('settles early instead of grinding a long absence', () => {
    // Nothing owed, nothing derelict: every day is a no-op however long the absence.
    const pile: Stockpile = { stone: 2 };
    const plan = runUpkeepOverDays(pile, 30, 1, 0);
    expect(plan.pile).toBe(pile);
    expect(plan.paid).toBe(0);
  });

  it('bleeds a long absence to the same floor the live pass converges on', () => {
    const plan = runUpkeepOverDays({}, 7, 4, 0);
    expect(plan.lapsed).toBe(3); // 4 standing → 1, the affordable skyline
  });
});

describe('lines', () => {
  it('name the ground and the landmark, with no leading article', () => {
    expect(lapsedLine('The Grove', '🗿')).toBe("🛠️ The Grove's 🗿 fell into disrepair");
    expect(patchedLine('The Grove', '🗿')).toBe('🛠️ The Grove patched up its 🗿');
  });
});
