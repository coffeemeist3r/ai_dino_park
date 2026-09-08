import { describe, expect, it } from 'vitest';
import { keeperDay } from '../../game/src/world/keeperclock';
import { NO_STREAK, noteDay, streakLine, type Streak } from '../../game/src/world/streak';

/**
 * BACKLOG-122. Every day string in here is built through `keeperDay` from a *local* date constructor, never
 * typed as a literal, so these assertions mean the same thing in any timezone CI happens to run in — which
 * is the whole reason `keeperclock.ts` exists.
 */
const dayOf = (y: number, m: number, d: number) => keeperDay(new Date(y, m - 1, d, 12).getTime());

describe('noteDay (BACKLOG-122)', () => {
  it('returns the same reference when the day has not changed', () => {
    const today = dayOf(2026, 9, 8);
    const first = noteDay(NO_STREAK, today);
    expect(noteDay(first, today)).toBe(first); // identity, not just equality — the caller skips the save on this
  });

  it('starts a fresh save at day one', () => {
    const s = noteDay(NO_STREAK, dayOf(2026, 9, 8));
    expect(s).toEqual({ last: dayOf(2026, 9, 8), run: 1, best: 1 });
  });

  it('increments across a genuine calendar-day boundary', () => {
    let s = noteDay(NO_STREAK, dayOf(2026, 9, 8));
    s = noteDay(s, dayOf(2026, 9, 9));
    s = noteDay(s, dayOf(2026, 9, 10));
    expect(s.run).toBe(3);
    expect(s.best).toBe(3);
  });

  it('crosses a month end, which is the case string arithmetic would get wrong', () => {
    let s = noteDay(NO_STREAK, dayOf(2026, 9, 30));
    s = noteDay(s, dayOf(2026, 10, 1));
    expect(s.run).toBe(2);
  });

  it('crosses a leap day', () => {
    let s = noteDay(NO_STREAK, dayOf(2028, 2, 28));
    s = noteDay(s, dayOf(2028, 2, 29));
    s = noteDay(s, dayOf(2028, 3, 1));
    expect(s.run).toBe(3);
  });

  it('resets to one across a gap of two or more days', () => {
    let s = noteDay(NO_STREAK, dayOf(2026, 9, 8));
    s = noteDay(s, dayOf(2026, 9, 9));
    expect(s.run).toBe(2);
    s = noteDay(s, dayOf(2026, 9, 12));
    expect(s.run).toBe(1);
  });

  it('never lets best fall, including through a reset', () => {
    let s: Streak = NO_STREAK;
    for (const d of [8, 9, 10, 11]) s = noteDay(s, dayOf(2026, 9, d));
    expect(s.best).toBe(4);
    s = noteDay(s, dayOf(2026, 9, 20)); // a fortnight off
    expect(s.run).toBe(1);
    expect(s.best).toBe(4);
  });

  it('does not count backwards as adjacent', () => {
    let s = noteDay(NO_STREAK, dayOf(2026, 9, 9));
    s = noteDay(s, dayOf(2026, 9, 8)); // a keeper whose machine clock went back
    expect(s.run).toBe(1);
  });

  /**
   * The DST case, mirroring `keeperclock.test.ts`'s precedent: exercised where the runner's zone has a
   * transition, warned-and-skipped where it does not, rather than pinned to one CI timezone.
   */
  it('treats the day after a DST transition as adjacent', () => {
    const transitions: Array<[number, number, number]> = [];
    for (let m = 1; m <= 12; m++) {
      for (let d = 1; d <= 28; d++) {
        const a = new Date(2026, m - 1, d, 12).getTimezoneOffset();
        const b = new Date(2026, m - 1, d + 1, 12).getTimezoneOffset();
        if (a !== b) transitions.push([2026, m, d]);
      }
    }
    if (!transitions.length) {
      console.warn('streak: no DST transition in this timezone — adjacency-across-DST not exercised');
      return;
    }
    for (const [y, m, d] of transitions) {
      const s = noteDay(noteDay(NO_STREAK, dayOf(y, m, d)), dayOf(y, m, d + 1));
      expect(s.run, `${dayOf(y, m, d)} -> ${dayOf(y, m, d + 1)}`).toBe(2);
    }
  });
});

describe('streakLine (BACKLOG-122)', () => {
  it('says nothing at all before a first visit', () => {
    expect(streakLine(NO_STREAK)).toBe('');
  });

  it('names the first day rather than counting it', () => {
    expect(streakLine({ last: '2026-09-08', run: 1, best: 1 })).toBe('first day');
  });

  it('counts a run', () => {
    expect(streakLine({ last: '2026-09-08', run: 3, best: 3 })).toBe('3 days running');
  });

  it('carries the best only once it is behind you', () => {
    expect(streakLine({ last: '2026-09-08', run: 2, best: 5 })).toBe('2 days running · best 5');
  });
});
