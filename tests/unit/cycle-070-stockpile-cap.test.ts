import { describe, it, expect } from 'vitest';
import { bankResource, atCap, craft, STOCKPILE_CAP, type Stockpile } from '../../game/src/world/resource';

describe('stockpile capacity + pressure (BACKLOG-309)', () => {
  it('atCap reports a kind at/over the cap', () => {
    expect(atCap({ branch: STOCKPILE_CAP }, 'branch')).toBe(true);
    expect(atCap({ branch: STOCKPILE_CAP - 1 }, 'branch')).toBe(false);
    expect(atCap({}, 'stone')).toBe(false);
  });

  it('bankResource clamps at the cap (no overflow)', () => {
    const full: Stockpile = { branch: STOCKPILE_CAP };
    const after = bankResource(full, 'branch');
    expect(after.branch).toBe(STOCKPILE_CAP); // not CAP + 1
  });

  it('a kind below the cap still banks', () => {
    expect(bankResource({ branch: STOCKPILE_CAP - 1 }, 'branch').branch).toBe(STOCKPILE_CAP);
  });

  it('is still pure at the cap — never mutates the input', () => {
    const before: Stockpile = { branch: STOCKPILE_CAP };
    const after = bankResource(before, 'branch');
    expect(before).toEqual({ branch: STOCKPILE_CAP });
    expect(after).toEqual({ branch: STOCKPILE_CAP });
  });

  it('a craft that spends a capped kind drops it below the cap, relieving the pressure', () => {
    // branch maxed, plenty of stone → the craft recipe (3 branch + 2 stone) spends branches.
    const pile: Stockpile = { branch: STOCKPILE_CAP, stone: 4 };
    expect(atCap(pile, 'branch')).toBe(true);
    const spent = craft(pile);
    expect(spent).not.toBeNull();
    expect(atCap(spent!, 'branch')).toBe(false); // banking branches works again
  });
});
