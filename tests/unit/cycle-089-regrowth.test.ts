import { describe, it, expect } from 'vitest';
import {
  YIELD_MAX,
  YIELD_DEPLETE,
  YIELD_REGROW,
  depleteYield,
  regrowYield,
  yieldSpawnChance,
  rollResourceAt,
} from '../../game/src/world/regrowth';

/**
 * Resource regrowth (BACKLOG-384) — per-zone yield the pickup thins and time regrows, scaling the spawn roll.
 * The pure math is decided here; WorldScene only holds the per-zone value and calls these.
 */
describe('BACKLOG-384 resource regrowth', () => {
  it('deplete thins by YIELD_DEPLETE and floors at 0 (never negative)', () => {
    expect(depleteYield(YIELD_MAX)).toBeCloseTo(YIELD_MAX - YIELD_DEPLETE);
    expect(depleteYield(0.1)).toBe(0); // would go negative → clamped to 0
    expect(depleteYield(0)).toBe(0);
  });

  it('regrow restores by YIELD_REGROW and caps at YIELD_MAX (never above full)', () => {
    expect(regrowYield(0.5)).toBeCloseTo(0.5 + YIELD_REGROW);
    expect(regrowYield(YIELD_MAX)).toBe(YIELD_MAX); // already full → stays full
    expect(regrowYield(YIELD_MAX - YIELD_REGROW / 2)).toBe(YIELD_MAX); // would overshoot → clamped
  });

  it('spawn chance scales linearly with yield: full = base, empty = 0', () => {
    const base = 0.12;
    expect(yieldSpawnChance(base, 1)).toBeCloseTo(base);
    expect(yieldSpawnChance(base, 0)).toBe(0);
    expect(yieldSpawnChance(base, 0.5)).toBeCloseTo(base / 2);
    // monotonic in y
    expect(yieldSpawnChance(base, 0.25)).toBeLessThan(yieldSpawnChance(base, 0.75));
  });

  it('rollResourceAt fires below the scaled chance and not at/above it', () => {
    const base = 0.5;
    const y = 0.5; // scaled chance = 0.25
    expect(rollResourceAt(base, y, () => 0.1)).toBe(true); // 0.1 < 0.25
    expect(rollResourceAt(base, y, () => 0.24)).toBe(true);
    expect(rollResourceAt(base, y, () => 0.25)).toBe(false); // at the boundary, does not fire
    expect(rollResourceAt(base, y, () => 0.9)).toBe(false);
    // an exhausted zone never spawns, whatever the roll
    expect(rollResourceAt(base, 0, () => 0)).toBe(false);
  });

  it('a full→exhaust→regrow round trip: ~3 gathers empty a zone, then it climbs back toward full', () => {
    let y = YIELD_MAX;
    y = depleteYield(y); // 0.66
    y = depleteYield(y); // 0.32
    y = depleteYield(y); // 0 (clamped)
    expect(y).toBe(0);
    for (let i = 0; i < 5; i++) y = regrowYield(y);
    expect(y).toBeGreaterThan(0);
    expect(y).toBeLessThanOrEqual(YIELD_MAX);
  });
});
