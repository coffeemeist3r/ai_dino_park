import { describe, it, expect } from 'vitest';
import { stargazingPairs, SHARED_WONDER_BOND, type Gazer } from '../../game/src/world/skyEvent';
import { strengthen, bondPoints } from '../../game/src/social/bonds';

describe('stargazing companions (BACKLOG-288)', () => {
  it('pairs two gazers that settled within one tile', () => {
    const gazers: Gazer[] = [
      { name: 'Rex', tileX: 10, tileY: 7 },
      { name: 'Sunny', tileX: 11, tileY: 7 }, // adjacent (dx 1)
    ];
    expect(stargazingPairs(gazers)).toEqual([['Rex', 'Sunny']]);
  });

  it('treats a diagonal neighbour as adjacent (Chebyshev ≤ 1)', () => {
    const gazers: Gazer[] = [
      { name: 'Rex', tileX: 10, tileY: 7 },
      { name: 'Glade', tileX: 11, tileY: 8 }, // dx 1, dy 1
    ];
    expect(stargazingPairs(gazers)).toEqual([['Rex', 'Glade']]);
  });

  it('leaves a 2-tile-away edge-watcher unpaired', () => {
    const gazers: Gazer[] = [
      { name: 'Rex', tileX: 10, tileY: 7 },
      { name: 'Sunny', tileX: 11, tileY: 7 }, // near Rex
      { name: 'Twitch', tileX: 10, tileY: 9 }, // 2 tiles from both → lone
    ];
    expect(stargazingPairs(gazers)).toEqual([['Rex', 'Sunny']]);
  });

  it('pairs three mutually-adjacent gazers into all three pairs', () => {
    const gazers: Gazer[] = [
      { name: 'Rex', tileX: 10, tileY: 7 },
      { name: 'Sunny', tileX: 10, tileY: 7 }, // stacked (ring 0)
      { name: 'Glade', tileX: 11, tileY: 7 },
    ];
    expect(stargazingPairs(gazers)).toEqual([
      ['Rex', 'Sunny'],
      ['Rex', 'Glade'],
      ['Sunny', 'Glade'],
    ]);
  });

  it('never pairs a dino with itself', () => {
    const gazers: Gazer[] = [
      { name: 'Rex', tileX: 10, tileY: 7 },
      { name: 'Rex', tileX: 10, tileY: 7 },
    ];
    expect(stargazingPairs(gazers)).toEqual([]);
  });

  it('applies SHARED_WONDER_BOND through the shared bond store', () => {
    const bonds = strengthen({}, 'Rex', 'Sunny', SHARED_WONDER_BOND);
    expect(bondPoints(bonds, 'Rex', 'Sunny')).toBe(SHARED_WONDER_BOND);
  });
});
