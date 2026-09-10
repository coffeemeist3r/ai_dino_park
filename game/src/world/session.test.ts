import { describe, it, expect } from 'vitest';
import {
  openSession,
  closeSession,
  sessionMs,
  pushSession,
  sittingLine,
  SESSIONS_KEPT,
} from './session';
import { SESSION_MIN_MS } from './departure';

describe('BACKLOG-542 — the sitting as a record', () => {
  it('opens a session with no end', () => {
    const s = openSession(1_000);
    expect(s).toEqual({ startedAt: 1_000 });
    expect(s.endedAt).toBeUndefined();
  });

  it('closes an open session at the given moment', () => {
    expect(closeSession(openSession(1_000), 5_000)).toEqual({ startedAt: 1_000, endedAt: 5_000 });
  });

  it('closing a closed session returns the very same object — the alt-tab double-fire cannot re-stamp', () => {
    const closed = closeSession(openSession(1_000), 5_000);
    expect(closeSession(closed, 9_999)).toBe(closed);
  });

  it('measures an open session against now, and a closed one against its end', () => {
    expect(sessionMs(openSession(1_000), 4_000)).toBe(3_000);
    expect(sessionMs(closeSession(openSession(1_000), 4_000), 90_000)).toBe(3_000);
  });

  it('never reads a negative sitting when the wall clock steps backwards', () => {
    expect(sessionMs(openSession(9_000), 1_000)).toBe(0);
  });

  it('an open session with no now reads zero rather than NaN', () => {
    expect(sessionMs(openSession(1_000))).toBe(0);
  });

  it('keeps the last three sittings, newest first', () => {
    let list = pushSession([], closeSession(openSession(1), 2));
    list = pushSession(list, closeSession(openSession(3), 4));
    list = pushSession(list, closeSession(openSession(5), 6));
    list = pushSession(list, closeSession(openSession(7), 8));
    expect(SESSIONS_KEPT).toBe(3);
    expect(list.map((s) => s.startedAt)).toEqual([7, 5, 3]);
  });

  it('does not mutate the list it was handed', () => {
    const before = [closeSession(openSession(1), 2)];
    pushSession(before, closeSession(openSession(3), 4));
    expect(before).toHaveLength(1);
  });
});

describe('BACKLOG-542 — the engraved duration', () => {
  it.each([
    [0, '0s'],
    [999, '0s'],
    [40_000, '40s'],
    [60_000, '1m'],
    [100_000, '1m 40s'],
    [720_000, '12m'],
    [3_600_000, '1h'],
    [3_840_000, '1h 4m'],
  ])('%i ms reads as %s', (ms, want) => {
    expect(sittingLine(ms)).toBe(want);
  });

  it('drops the smaller unit only when it is zero', () => {
    expect(sittingLine(725_000)).toBe('12m 5s');
  });

  it('never renders a negative duration', () => {
    expect(sittingLine(-5_000)).toBe('0s');
  });
});

describe('BACKLOG-542 — the sitting floor is not written down twice', () => {
  it('borrows departure.ts SESSION_MIN_MS rather than declaring its own', () => {
    // The assertion that matters is the import above: session.ts exports no floor of its own, so this
    // is the only place a sitting's minimum can come from. If a copy is ever added, this file is where
    // the duplicate becomes visible.
    expect(SESSION_MIN_MS).toBe(20_000);
  });
});
