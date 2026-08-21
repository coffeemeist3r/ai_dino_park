import { describe, it, expect, beforeEach } from 'vitest';
import { ACTIVE_SCALE, AWAY_SCALE, WorldClock, resetClockForTest, type GameTime } from '../../game/src/world/clock';
import { awayMinutes } from '../../game/src/world/away';

beforeEach(() => {
  resetClockForTest();
});

describe('WorldClock', () => {
  it('initializes at day 1, hour 8, minute 0', () => {
    const clock = new WorldClock();
    expect(clock.now()).toEqual({ day: 1, hour: 8, minute: 0 });
  });

  it('onHour fires once after 60 ticks with correct payload', () => {
    const clock = new WorldClock();
    const calls: GameTime[] = [];
    clock.onHour((t) => calls.push(t));
    for (let i = 0; i < 60; i++) clock.tick();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({ day: 1, hour: 9, minute: 0 });
  });

  it('onHour fires twice after 120 ticks', () => {
    const clock = new WorldClock();
    const hours: number[] = [];
    clock.onHour((t) => hours.push(t.hour));
    for (let i = 0; i < 120; i++) clock.tick();
    expect(hours).toEqual([9, 10]);
  });

  it('wraps midnight and increments day', () => {
    const clock = new WorldClock();
    // Advance from 08:00 to 23:59 = 15h59m = 959 ticks
    for (let i = 0; i < 959; i++) clock.tick();
    expect(clock.now()).toEqual({ day: 1, hour: 23, minute: 59 });

    const captured: GameTime[] = [];
    clock.onHour((t) => captured.push(t));
    clock.tick(); // 23:59 + 1min = 00:00 day 2
    expect(captured).toHaveLength(1);
    expect(captured[0]).toEqual({ day: 2, hour: 0, minute: 0 });
  });

  it('onTick fires every tick', () => {
    const clock = new WorldClock();
    let count = 0;
    clock.onTick(() => count++);
    clock.tick();
    clock.tick();
    clock.tick();
    expect(count).toBe(3);
  });

  it('now() returns a copy — mutation does not affect internal state', () => {
    const clock = new WorldClock();
    const t = clock.now();
    t.hour = 99;
    expect(clock.now().hour).toBe(8);
  });
});

describe('WorldClock — wall-clock anchored', () => {
  /** Build a clock whose now-source is a mutable fake epoch starting at 0. */
  function fakeClock() {
    const clock = new WorldClock();
    const ref = { ms: 0 };
    clock.setNowSource(() => ref.ms); // re-anchors at ms=0
    return { clock, ref };
  }

  it('defaults to ACTIVE_SCALE — a 24-minute in-game day while somebody is watching (BACKLOG-493)', () => {
    const { clock } = fakeClock();
    expect(clock.getScale()).toBe(ACTIVE_SCALE);
    expect(ACTIVE_SCALE).toBe(60);
  });

  it('at 1× advances 1 in-game minute per 60s of real time', () => {
    const { clock, ref } = fakeClock();
    clock.setScale(1);
    ref.ms = 60_000;
    clock.update();
    expect(clock.now()).toEqual({ day: 1, hour: 8, minute: 1 });
  });

  it('at 60× advances 60 in-game minutes per 60s of real time', () => {
    const { clock, ref } = fakeClock();
    clock.setScale(60);
    ref.ms = 60_000;
    clock.update();
    expect(clock.now()).toEqual({ day: 1, hour: 9, minute: 0 });
  });

  it('update() crossing hour boundaries fires onHour once per crossed hour', () => {
    const { clock, ref } = fakeClock();
    clock.setScale(60); // 1 real min = 1 in-game hour
    const hours: number[] = [];
    clock.onHour((t) => hours.push(t.hour));
    ref.ms = 3 * 60_000; // 3 in-game hours
    clock.update();
    expect(hours).toEqual([9, 10, 11]);
    expect(clock.now()).toEqual({ day: 1, hour: 11, minute: 0 });
  });

  it('a gap larger than the catch-up cap jumps without flooding onTick', () => {
    const { clock, ref } = fakeClock();
    clock.setScale(1); // explicit: this case is about the catch-up cap, not about the default rate
    let ticks = 0;
    clock.onTick(() => ticks++);
    // 2 real days of ms at 1× = 2880 in-game minutes, well over the 1440 cap.
    ref.ms = 60_000 * 60 * 24 * 2;
    clock.update();
    // Lands on the correct wall-clock time...
    expect(clock.now()).toEqual({ day: 3, hour: 8, minute: 0 });
    // ...but did not fire per-minute listeners for the whole span.
    expect(ticks).toBe(0);
  });

  it('setScale does not jump the displayed time', () => {
    const { clock, ref } = fakeClock();
    clock.setScale(1);
    ref.ms = 30 * 60_000; // 08:30 at 1×
    clock.update();
    const before = clock.now();
    clock.setScale(60);
    expect(clock.now()).toEqual(before); // re-anchored, no jump
    // and time flows at the new rate from here
    ref.ms += 60_000; // +1 real min = +60 in-game min at 60×
    clock.update();
    expect(clock.now()).toEqual({ day: 1, hour: 9, minute: 30 });
  });

  it('set() re-anchors: a same-instant update is a no-op', () => {
    const { clock, ref } = fakeClock();
    ref.ms = 5 * 60_000;
    clock.set({ day: 2, hour: 12, minute: 0 });
    clock.update(); // no real time elapsed since the set/anchor
    expect(clock.now()).toEqual({ day: 2, hour: 12, minute: 0 });
  });

  it('tick() remains scale-independent (the minute primitive)', () => {
    const { clock } = fakeClock();
    clock.setScale(60);
    clock.tick();
    expect(clock.now()).toEqual({ day: 1, hour: 8, minute: 1 });
  });
});

describe('the world runs at two rates (BACKLOG-493 — operator ruling)', () => {
  it('is fast in the foreground and real-time when nobody is watching', () => {
    expect(ACTIVE_SCALE).toBe(60); // a 24-minute in-game day: day-boundary beats are watchable
    expect(AWAY_SCALE).toBe(1); //  ...and an unattended world ages one in-game day per real day
    expect(ACTIVE_SCALE).toBeGreaterThan(AWAY_SCALE);
  });

  it('keeps AWAY_SCALE at exactly 1, which is what stops "a while away" changing meaning', () => {
    // The whole away path — the 7-day cap, the spoilage bleed, the drift-per-day, the digest's wording —
    // was written and tuned against real time. This assertion exists so that stays deliberate: raising
    // AWAY_SCALE silently redefines every one of them at once.
    expect(AWAY_SCALE).toBe(1);
  });

  it('a week away is seven in-game days, not four hundred and twenty', () => {
    const WEEK_MS = 7 * 24 * 60 * 60_000;
    const minutesAtAway = awayMinutes(0, AWAY_SCALE, WEEK_MS);
    expect(minutesAtAway / (24 * 60)).toBe(7);
    // The bug this design avoids: catching up at the *watching* rate.
    expect(awayMinutes(0, ACTIVE_SCALE, WEEK_MS) / (24 * 60)).toBe(420);
  });
});
