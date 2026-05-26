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
