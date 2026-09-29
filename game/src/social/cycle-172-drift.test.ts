import { describe, it, expect } from 'vitest';
import { driftBonds, meetGain, strengthen, bondPoints, BOND_DRIFT } from './bonds';
import { LONER_FLOOR } from '../world/loner';

describe('BACKLOG-570 bonds drift', () => {
  it('S1: cools toward rest and never crosses it; at or under rest is untouched', () => {
    const b = { 'A|B': 60, 'A|C': 8, 'B|C': 3 };
    const d = driftBonds(b, LONER_FLOOR);
    expect(d['A|B']).toBeLessThan(60);
    expect(d['A|B']).toBeGreaterThan(LONER_FLOOR);
    expect(d['A|C']).toBe(8);
    expect(d['B|C']).toBe(3);
    const still = { 'A|C': 8 };
    expect(driftBonds(still, LONER_FLOOR)).toBe(still);
  });

  it('S2: a pair meeting every step settles short of the cap', () => {
    let b = {};
    for (let i = 0; i < 3000; i++) {
      b = driftBonds(b, LONER_FLOOR);
      b = strengthen(b, 'A', 'B', meetGain(bondPoints(b, 'A', 'B')));
    }
    const v = bondPoints(b, 'A', 'B');
    expect(v).toBeGreaterThan(85);
    expect(v).toBeLessThan(95);
  });

  it('S3: a pair apart for ten minutes of steps visibly cools', () => {
    let b: Record<string, number> = { 'A|B': 30 };
    for (let i = 0; i < 200; i++) b = driftBonds(b, LONER_FLOOR);
    expect(b['A|B']).toBeGreaterThan(15);
    expect(b['A|B']).toBeLessThan(20);
  });

  it('S4: drift alone never crosses the floor', () => {
    let b: Record<string, number> = { 'A|B': LONER_FLOOR + 0.0001, 'A|C': LONER_FLOOR + 5 };
    for (let i = 0; i < 100000; i++) b = driftBonds(b, LONER_FLOOR, BOND_DRIFT * 10);
    expect(b['A|B']).toBeGreaterThanOrEqual(LONER_FLOOR);
    expect(b['A|C']).toBeGreaterThanOrEqual(LONER_FLOOR);
  });
});
