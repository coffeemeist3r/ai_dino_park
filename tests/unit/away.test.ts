import { describe, it, expect } from 'vitest';
import { awayMinutes, fastForward, MAX_AWAY_DAYS, type AwayInput } from '../../game/src/world/away';
import { pairKey } from '../../game/src/social/meetings';
import type { GameTime } from '../../game/src/world/clock';

const MIN_PER_DAY = 24 * 60;
const abs = (t: GameTime) => (t.day - 1) * MIN_PER_DAY + t.hour * 60 + t.minute;
const T0: GameTime = { day: 1, hour: 8, minute: 0 };

function input(over: Partial<AwayInput> = {}): AwayInput {
  return { time: T0, savedAt: 0, scale: 1, bonds: {}, memory: {}, ...over };
}

describe('awayMinutes', () => {
  it('returns 0 when there is no savedAt anchor', () => {
    expect(awayMinutes(undefined, 1, 1_000_000)).toBe(0);
  });

  it('returns 0 when now is not after the save', () => {
    expect(awayMinutes(5000, 1, 5000)).toBe(0);
    expect(awayMinutes(5000, 1, 4000)).toBe(0);
  });

  it('converts real ms to in-game minutes at 1x (60s = 1 min)', () => {
    expect(awayMinutes(0, 1, 120_000)).toBe(2);
  });

  it('applies the scale multiplier', () => {
    expect(awayMinutes(0, 60, 120_000)).toBe(120);
  });

  it('treats a missing/invalid scale as 1x', () => {
    expect(awayMinutes(0, undefined, 120_000)).toBe(2);
    expect(awayMinutes(0, 0, 120_000)).toBe(2);
  });
});

describe('fastForward', () => {
  it('no-ops when no time elapsed: identity state, empty digest', () => {
    const r = fastForward(input({ savedAt: 1000 }), 1000);
    expect(r.minutes).toBe(0);
    expect(r.time).toEqual(T0);
    expect(r.bonds).toEqual({});
    expect(r.digest).toEqual([]);
  });

  it('advances the clock by exactly the elapsed in-game minutes', () => {
    // 3 in-game days at 1x = 3*1440 min of real time.
    const r = fastForward(input(), 3 * MIN_PER_DAY * 60_000);
    expect(r.minutes).toBe(3 * MIN_PER_DAY);
    expect(abs(r.time) - abs(T0)).toBe(3 * MIN_PER_DAY);
    expect(r.days).toBe(3);
    expect(r.capped).toBe(false);
  });

  it('drifts companion pairs (bond >= 8) by DRIFT_PER_DAY*days, capped', () => {
    const key = pairKey('Rex', 'Glade');
    // 3 days → +2*3 = 6.
    const r = fastForward(input({ bonds: { [key]: 20 } }), 3 * MIN_PER_DAY * 60_000);
    expect(r.bonds[key]).toBe(26);
    expect(r.digest.some((l) => l.includes('grew closer'))).toBe(true);
  });

  it('caps total drift at MAX_DRIFT (12) over a long span', () => {
    const key = pairKey('Rex', 'Glade');
    // 7 days → 2*7 = 14, capped to 12.
    const r = fastForward(input({ bonds: { [key]: 20 } }), MAX_AWAY_DAYS * MIN_PER_DAY * 60_000);
    expect(r.bonds[key]).toBe(32);
  });

  it('leaves sub-threshold pairs untouched', () => {
    const key = pairKey('Rex', 'Twitch');
    const r = fastForward(input({ bonds: { [key]: 4 } }), 3 * MIN_PER_DAY * 60_000);
    expect(r.bonds[key]).toBe(4);
    expect(r.digest.some((l) => l.includes('kept to themselves'))).toBe(true);
  });

  it('records a "kept each other company" memory for both companions', () => {
    const key = pairKey('Rex', 'Glade');
    const r = fastForward(input({ bonds: { [key]: 20 } }), 2 * MIN_PER_DAY * 60_000);
    expect(r.memory['Rex'].some((m) => m.includes('Glade') && m.includes('company'))).toBe(true);
    expect(r.memory['Glade'].some((m) => m.includes('Rex') && m.includes('company'))).toBe(true);
  });

  it('caps the simulated span and flags it', () => {
    // 30 real-days worth at 1x.
    const r = fastForward(input(), 30 * MIN_PER_DAY * 60_000);
    expect(r.capped).toBe(true);
    expect(r.minutes).toBe(MAX_AWAY_DAYS * MIN_PER_DAY);
    expect(r.days).toBe(MAX_AWAY_DAYS);
    expect(r.digest[0]).toContain('and then some');
  });

  it('a sub-day gap notes the time but changes no bonds', () => {
    const key = pairKey('Rex', 'Glade');
    // 3 in-game hours.
    const r = fastForward(input({ bonds: { [key]: 20 } }), 3 * 60 * 60_000);
    expect(r.days).toBe(0);
    expect(r.bonds[key]).toBe(20);
    expect(r.digest.some((l) => l.includes('Barely'))).toBe(true);
  });
});
