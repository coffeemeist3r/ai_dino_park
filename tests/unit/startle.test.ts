import { describe, it, expect } from 'vitest';
import { reactionFor, fleeStep, startleStep, STARTLE_RANGE } from '../../game/src/world/startle';

describe('reactionFor', () => {
  it('ignores taps beyond range regardless of bravery', () => {
    expect(reactionFor(0.0, STARTLE_RANGE + 1)).toBe('ignore');
    expect(reactionFor(1.0, STARTLE_RANGE + 1)).toBe('ignore');
  });

  it('the bold investigate, the timid bolt (in range)', () => {
    expect(reactionFor(0.9, 2)).toBe('investigate');
    expect(reactionFor(0.1, 2)).toBe('bolt');
  });
});

describe('fleeStep', () => {
  it('moves one tile directly away from the tap along the dominant axis', () => {
    // tap to the left → flee right
    expect(fleeStep({ tileX: 10, tileY: 5 }, { tileX: 4, tileY: 5 }, 20, 15)).toEqual({ tileX: 11, tileY: 5 });
    // tap below → flee up
    expect(fleeStep({ tileX: 5, tileY: 10 }, { tileX: 5, tileY: 14 }, 20, 15)).toEqual({ tileX: 5, tileY: 9 });
  });

  it('stays on the map at the edge', () => {
    expect(fleeStep({ tileX: 19, tileY: 5 }, { tileX: 0, tileY: 5 }, 20, 15)).toEqual({ tileX: 19, tileY: 5 });
  });

  it('a tap on the same tile still nudges the dino off it', () => {
    const next = fleeStep({ tileX: 5, tileY: 5 }, { tileX: 5, tileY: 5 }, 20, 15);
    expect(next).not.toEqual({ tileX: 5, tileY: 5 });
  });
});

describe('startleStep', () => {
  const from = { tileX: 10, tileY: 10 };
  const tap = { tileX: 14, tileY: 10 };
  it('investigate steps toward, bolt steps away, ignore stays', () => {
    expect(startleStep(from, tap, 'investigate', 20, 15)).toEqual({ tileX: 11, tileY: 10 });
    expect(startleStep(from, tap, 'bolt', 20, 15)).toEqual({ tileX: 9, tileY: 10 });
    expect(startleStep(from, tap, 'ignore', 20, 15)).toEqual(from);
  });
});
