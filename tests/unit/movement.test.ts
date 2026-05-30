import { describe, it, expect } from 'vitest';
import { wanderStep, WANDER_DIRS } from '../../game/src/world/movement';
import { pairKey, recordMeet } from '../../game/src/social/meetings';

const COLS = 20;
const ROWS = 15;

describe('wanderStep', () => {
  it('never leaves the map from any corner, in any direction', () => {
    const corners = [
      { tileX: 0, tileY: 0 },
      { tileX: COLS - 1, tileY: 0 },
      { tileX: 0, tileY: ROWS - 1 },
      { tileX: COLS - 1, tileY: ROWS - 1 },
    ];
    for (const c of corners) {
      for (let d = 0; d < WANDER_DIRS.length; d++) {
        const next = wanderStep(c, d, COLS, ROWS);
        expect(next.tileX).toBeGreaterThanOrEqual(0);
        expect(next.tileX).toBeLessThan(COLS);
        expect(next.tileY).toBeGreaterThanOrEqual(0);
        expect(next.tileY).toBeLessThan(ROWS);
      }
    }
  });

  it('moves at most one tile on each axis', () => {
    const t = { tileX: 5, tileY: 5 };
    for (let d = 0; d < WANDER_DIRS.length; d++) {
      const next = wanderStep(t, d, COLS, ROWS);
      expect(Math.abs(next.tileX - t.tileX)).toBeLessThanOrEqual(1);
      expect(Math.abs(next.tileY - t.tileY)).toBeLessThanOrEqual(1);
    }
  });

  it('direction 0 is a no-op (stay)', () => {
    expect(wanderStep({ tileX: 3, tileY: 4 }, 0, COLS, ROWS)).toEqual({ tileX: 3, tileY: 4 });
  });
});

describe('meetings', () => {
  it('pairKey is order-independent', () => {
    expect(pairKey('Rex', 'Sunny')).toBe(pairKey('Sunny', 'Rex'));
  });

  it('recordMeet increments symmetrically and ignores self-meets', () => {
    let m = recordMeet({}, 'Rex', 'Sunny');
    expect(m[pairKey('Rex', 'Sunny')]).toBe(1);
    m = recordMeet(m, 'Sunny', 'Rex');
    expect(m[pairKey('Rex', 'Sunny')]).toBe(2);
    expect(recordMeet(m, 'Rex', 'Rex')).toBe(m); // self-meet is a no-op
  });
});
