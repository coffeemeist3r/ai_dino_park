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

describe('side by side means the same ground (CHARTER v7 bug fix)', () => {
  it('does not pair two dinos who share tile coordinates on different grounds', () => {
    // Each ground is its own 20×15 grid, so identical coordinates in two zones are a whole zone apart.
    // Before the roster spread across the map this could not happen, and the assumption went unwritten.
    expect(
      stargazingPairs([
        { name: 'Rex', tileX: 5, tileY: 6, zone: 'bowl' },
        { name: 'Bramble', tileX: 5, tileY: 7, zone: 'grove' },
      ]),
    ).toEqual([]);
  });

  it('still pairs neighbours on the same ground', () => {
    expect(
      stargazingPairs([
        { name: 'Rex', tileX: 5, tileY: 6, zone: 'bowl' },
        { name: 'Sunny', tileX: 5, tileY: 7, zone: 'bowl' },
      ]),
    ).toEqual([['Rex', 'Sunny']]);
  });

  it('treats an absent zone as one shared ground — every pre-v7 caller is unchanged', () => {
    expect(
      stargazingPairs([
        { name: 'Rex', tileX: 5, tileY: 6 },
        { name: 'Sunny', tileX: 5, tileY: 7 },
      ]),
    ).toEqual([['Rex', 'Sunny']]);
  });
});
