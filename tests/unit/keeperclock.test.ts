import { describe, it, expect, afterEach } from 'vitest';
import {
  keeperHour,
  keeperDay,
  getKeeperClock,
  setKeeperNowSource,
  resetKeeperClock,
} from '../../game/src/world/keeperclock';
import { noteVisit } from '../../game/src/world/vigil';

/**
 * The keeper's own clock (BACKLOG-529).
 *
 * The point of these tests is not that `getHours()` works. It is that the three answers the module's header
 * writes down are answers the code actually gives — DST fall-back records both sightings, spring-forward
 * needs no special case, and a calendar day is the *player's* day and not UTC's.
 *
 * The two DST tests are environment-dependent by nature, and the honest thing to do on a machine with no DST
 * (a CI box on UTC, which is the common case here) is to skip them **loudly** rather than let them pass by
 * asserting nothing. `dstBoundary()` finds a real transition in the test machine's own zone or returns null.
 */

/** UTC offset in minutes at `ms`, in the test machine's local zone. */
function offsetAt(ms: number): number {
  return -new Date(ms).getTimezoneOffset();
}

/**
 * A real DST transition in this machine's zone, found by scanning a year at hour resolution: the last epoch
 * before the offset changes, and the first after. Returns null in a zone that has none.
 */
function dstBoundary(forward: boolean): { before: number; after: number } | null {
  const HOUR = 3_600_000;
  const start = Date.UTC(2026, 0, 1);
  let prev = offsetAt(start);
  for (let i = 1; i < 366 * 24; i++) {
    const t = start + i * HOUR;
    const off = offsetAt(t);
    if (off !== prev) {
      const gained = off > prev;
      if (gained === forward) return { before: t - HOUR, after: t };
      prev = off;
      continue;
    }
    prev = off;
  }
  return null;
}

afterEach(() => resetKeeperClock());

describe('keeperHour', () => {
  it('reads the local hour of an injected epoch', () => {
    const t = Date.UTC(2026, 5, 15, 12, 0, 0);
    expect(keeperHour(t)).toBe(new Date(t).getHours());
  });

  it('two epochs twelve hours apart are twelve hours apart on the dial', () => {
    const t = Date.UTC(2026, 5, 15, 3, 0, 0);
    const later = t + 12 * 3_600_000;
    expect((keeperHour(t) + 12) % 24).toBe(keeperHour(later));
  });
});

describe('DST — the two answers the header gives', () => {
  it('fall-back: the repeated local hour is recorded twice, not de-duplicated', () => {
    const b = dstBoundary(false);
    if (!b) {
      // Loud skip, per the codeplan: a zone with no DST cannot exercise this, and a silent pass would be
      // a test that asserts nothing while looking like coverage.
      console.warn('keeperclock: no DST fall-back in this timezone — repeated-hour assertion not exercised');
      return;
    }
    // The hour immediately after the clocks go back repeats an hour already lived.
    const repeated = keeperHour(b.after);
    const first = keeperHour(b.after - 3_600_000);
    expect(repeated).toBe(first);
    // Both sightings are kept: the keeper really was there twice at that local hour.
    const history = noteVisit(noteVisit([], first), repeated);
    expect(history).toEqual([first, repeated]);
    expect(history.length).toBe(2);
  });

  it('spring-forward: the skipped hour is simply never returned, and needs no special case', () => {
    const b = dstBoundary(true);
    if (!b) {
      console.warn('keeperclock: no DST spring-forward in this timezone — skipped-hour assertion not exercised');
      return;
    }
    // The local hour jumps by two across the boundary: one hour of real time, two on the dial.
    const before = keeperHour(b.before);
    const after = keeperHour(b.after);
    expect((after - before + 24) % 24).toBe(2);
    // The hour in between is the one that did not happen. No epoch on that day yields it.
    const skipped = (before + 1) % 24;
    const dayStart = b.before - 12 * 3_600_000;
    const hours = new Set<number>();
    for (let i = 0; i < 24; i++) hours.add(keeperHour(dayStart + i * 3_600_000));
    expect(hours.has(skipped)).toBe(false);
  });
});

describe('keeperDay', () => {
  it('is the local calendar day, and changes across local midnight', () => {
    const noon = new Date(2026, 5, 15, 12, 0, 0).getTime();
    const lateEvening = new Date(2026, 5, 15, 23, 30, 0).getTime();
    const justAfterMidnight = new Date(2026, 5, 16, 0, 30, 0).getTime();
    expect(keeperDay(noon)).toBe('2026-06-15');
    expect(keeperDay(lateEvening)).toBe(keeperDay(noon));
    expect(keeperDay(justAfterMidnight)).toBe('2026-06-16');
  });

  it('pads month and day', () => {
    expect(keeperDay(new Date(2026, 0, 5, 9, 0, 0).getTime())).toBe('2026-01-05');
  });
});

describe('the injected source', () => {
  it('getKeeperClock reads through it', () => {
    const t = new Date(2026, 5, 15, 7, 0, 0).getTime();
    setKeeperNowSource(() => t);
    expect(getKeeperClock().now()).toBe(t);
    expect(getKeeperClock().hour()).toBe(7);
    expect(getKeeperClock().day()).toBe('2026-06-15');
  });

  it('resetKeeperClock puts it back on the wall clock', () => {
    setKeeperNowSource(() => 0);
    resetKeeperClock();
    expect(Math.abs(getKeeperClock().now() - Date.now())).toBeLessThan(1000);
  });
});
