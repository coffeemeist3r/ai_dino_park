import { describe, it, expect } from 'vitest';
import { strengthen, bondPoints } from '../../game/src/social/bonds';
import { pairKey } from '../../game/src/social/meetings';
import { serialize, deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';

describe('bonds', () => {
  it('strengthens symmetrically, clamps to 100, and does not mutate the input', () => {
    let b = strengthen({}, 'Rex', 'Sunny', 30);
    expect(bondPoints(b, 'Rex', 'Sunny')).toBe(30);
    expect(bondPoints(b, 'Sunny', 'Rex')).toBe(30); // symmetric
    const before = b;
    b = strengthen(b, 'Sunny', 'Rex', 90);
    expect(bondPoints(b, 'Rex', 'Sunny')).toBe(100); // clamped
    expect(bondPoints(before, 'Rex', 'Sunny')).toBe(30); // original unchanged
  });

  it('ignores self-bonds and keys by sorted pair', () => {
    expect(strengthen({}, 'Rex', 'Rex', 10)).toEqual({});
    expect(Object.keys(strengthen({}, 'Sunny', 'Rex', 5))[0]).toBe(pairKey('Rex', 'Sunny'));
  });

  it('bondPoints is 0 for an unknown pair', () => {
    expect(bondPoints({}, 'A', 'B')).toBe(0);
  });
});

describe('bonds in the save', () => {
  it('round-trips the bonds map', () => {
    const data = {
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 0, y: 0 },
      friendship: {},
      memory: {},
      bonds: { 'Mossback|Rex': 24 },
    };
    expect(deserialize(serialize(data))?.bonds).toEqual({ 'Mossback|Rex': 24 });
  });

  it('defaults a v1 save with no bonds field to an empty map', () => {
    const legacy = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 0, y: 0 },
    });
    expect(deserialize(legacy)?.bonds).toEqual({});
  });
});
