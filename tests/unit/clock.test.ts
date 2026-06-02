import { describe, it, expect, beforeEach } from 'vitest';
import { WorldClock, resetClockForTest, type GameTime } from '../../game/src/world/clock';

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

  it('defaults to 1× and advances 1 in-game minute per 60s of real time', () => {
    const { clock, ref } = fakeClock();
    expect(clock.getScale()).toBe(1);
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
    let ticks = 0;
    clock.onTick(() => ticks++);
    // 60× × 2 real days of ms = 2880 in-game minutes, well over the 1440 cap.
    ref.ms = 60_000 * 60 * 24 * 2;
    clock.update();
    // Lands on the correct wall-clock time...
    expect(clock.now()).toEqual({ day: 3, hour: 8, minute: 0 });
    // ...but did not fire per-minute listeners for the whole span.
    expect(ticks).toBe(0);
  });

  it('setScale does not jump the displayed time', () => {
    const { clock, ref } = fakeClock();
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
