import { describe, it, expect } from 'vitest';
import { cooldownReady } from '../../game/src/world/clock';

describe('cooldownReady — real-time pacing gate (BACKLOG-333)', () => {
  it('is false before the cooldown elapses', () => {
    expect(cooldownReady(1_000, 0, 60_000)).toBe(false);
    expect(cooldownReady(59_999, 0, 60_000)).toBe(false);
  });

  it('is true at and after the cooldown', () => {
    expect(cooldownReady(60_000, 0, 60_000)).toBe(true);
    expect(cooldownReady(120_000, 30_000, 60_000)).toBe(true);
  });

  it('a never-fired last (0) is ready once now passes the cooldown', () => {
    expect(cooldownReady(60_000, 0, 60_000)).toBe(true);
  });
});
