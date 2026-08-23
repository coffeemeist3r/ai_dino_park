import { describe, it, expect } from 'vitest';
import { recordCall, COUNCIL_CAUSE, BILL_CAUSE, type CauseLog } from '../../game/src/world/gates';
import { soundsDiscontent, SHORTS_BEFORE_WORD } from '../../game/src/world/discontent';

/**
 * The gate that was written for one door (BACKLOG-489). Every rule here is 481's rule, kept — the only
 * change is that "first" is asked of the *cause* instead of the ordinal.
 */
describe('recordCall', () => {
  const empty: CauseLog<string> = {};

  it('says nothing when a cause repeats itself — only a change is news', () => {
    const first = recordCall(empty, 'grove:work', BILL_CAUSE, 'gather');
    const again = recordCall(first.log, 'grove:work', BILL_CAUSE, 'gather');
    expect(again.announce).toBe(false);
    expect(again.log).toBe(first.log);
  });

  it("seeds the council's opening seating silently — 481's rule, unchanged", () => {
    const seat = recordCall(empty, 'grove:work', COUNCIL_CAUSE, 'gather');
    expect(seat.announce).toBe(false);
    expect(seat.log['grove:work'].council).toBe('gather');
  });

  it('announces a first record from a cause with no founding moment', () => {
    expect(recordCall(empty, 'grove:work', BILL_CAUSE, 'gather').announce).toBe(true);
  });

  it('THE ITEM — a new cause on an already-seeded ground is heard, even saying the same thing', () => {
    const seated = recordCall(empty, 'grove:work', COUNCIL_CAUSE, 'gather');
    expect(seated.announce).toBe(false);
    const bill = recordCall(seated.log, 'grove:work', BILL_CAUSE, 'gather');
    expect(bill.announce).toBe(true);
    // ...and both readings survive side by side, so neither overwrites the other's memory.
    expect(bill.log['grove:work']).toEqual({ council: 'gather', bill: 'gather' });
  });

  it('announces a seeded cause that changes its mind', () => {
    const seat = recordCall(empty, 'grove:work', COUNCIL_CAUSE, 'gather');
    expect(recordCall(seat.log, 'grove:work', COUNCIL_CAUSE, 'build').announce).toBe(true);
  });

  it('keeps grounds apart — a call on one key seeds nothing on another', () => {
    const grove = recordCall(empty, 'grove:work', COUNCIL_CAUSE, 'gather');
    const ridge = recordCall(grove.log, 'ridge:work', COUNCIL_CAUSE, 'gather');
    expect(ridge.announce).toBe(false); // its own opening seating, silent on its own terms
    expect(recordCall(ridge.log, 'ridge:work', BILL_CAUSE, 'gather').announce).toBe(true);
  });

  it('keeps a ground’s two votes apart — the pantry does not seed the labour call', () => {
    const work = recordCall(empty, 'grove:work', COUNCIL_CAUSE, 'gather');
    const spend = recordCall(work.log, 'grove:spend', COUNCIL_CAUSE, 'feed');
    expect(spend.announce).toBe(false);
    expect(Object.keys(spend.log)).toEqual(['grove:work', 'grove:spend']);
  });

  it('does not mutate the log it is handed', () => {
    const log: CauseLog<string> = {};
    recordCall(log, 'grove:work', BILL_CAUSE, 'gather');
    expect(log).toEqual({});
  });
});

/**
 * The control. 489's text names the once-a-day discontent as one of the four gates carrying the defect. It
 * does not: `lastDay` is null on a ground that has never sounded, so a first grievance is heard. This spec
 * exists so the finding is pinned rather than asserted in a handoff nobody re-runs.
 */
describe('soundsDiscontent (not one of the four)', () => {
  it('a ground that has never sounded is heard the first time it qualifies', () => {
    expect(soundsDiscontent(SHORTS_BEFORE_WORD, null, 3)).toBe(true);
  });

  it('...and is not heard twice the same day', () => {
    expect(soundsDiscontent(SHORTS_BEFORE_WORD, 3, 3)).toBe(false);
  });
});
