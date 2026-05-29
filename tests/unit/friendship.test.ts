import { describe, it, expect } from 'vitest';
import {
  heartsFromPoints,
  bumpPoints,
  heartString,
  greetGain,
  BASE_GAIN,
  HEARTS_MAX,
  type Friendship,
} from '../../game/src/social/friendship';
import { serialize, deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';
import type { Personality } from '../../game/src/ai/personality';

const base: Personality = {
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness: 0.5,
  bravery: 0.5,
};

describe('heartsFromPoints', () => {
  it('maps points to 0..10 hearts and clamps', () => {
    expect(heartsFromPoints(0)).toBe(0);
    expect(heartsFromPoints(35)).toBe(3);
    expect(heartsFromPoints(100)).toBe(10);
    expect(heartsFromPoints(105)).toBe(10);
    expect(heartsFromPoints(-5)).toBe(0);
  });
});

describe('bumpPoints', () => {
  it('clamps to [0,100] and does not mutate the input', () => {
    const f: Friendship = { Rex: 98 };
    const next = bumpPoints(f, 'Rex', 5);
    expect(next.Rex).toBe(100);
    expect(f.Rex).toBe(98); // original unchanged
    expect(bumpPoints({}, 'New', -3).New).toBe(0);
  });
});

describe('heartString', () => {
  it('is always length 10 with exactly h filled hearts', () => {
    const s = heartString(3);
    expect(s).toHaveLength(HEARTS_MAX);
    expect([...s].filter((c) => c === '♥')).toHaveLength(3);
  });
});

describe('greetGain', () => {
  it('is the base gain without traits', () => {
    expect(greetGain(undefined)).toBe(BASE_GAIN);
  });

  it('rewards warm, social dinos more than prickly, solitary ones, within bounds', () => {
    const warm = greetGain({ ...base, agreeableness: 0.9, sociability: 0.9 });
    const prickly = greetGain({ ...base, agreeableness: 0.05, sociability: 0.05 });
    expect(warm).toBeGreaterThan(prickly);
    expect(warm).toBeLessThanOrEqual(HEARTS_MAX);
  });
});

describe('friendship in the save', () => {
  it('round-trips the affinity map', () => {
    const data = {
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 0, y: 0 },
      friendship: { Rex: 40, Sunny: 10 },
    };
    expect(deserialize(serialize(data))?.friendship).toEqual({ Rex: 40, Sunny: 10 });
  });

  it('defaults a v1 save with no friendship field to an empty map', () => {
    const legacy = JSON.stringify({
      version: SAVE_VERSION,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 0, y: 0 },
    });
    expect(deserialize(legacy)?.friendship).toEqual({});
  });
});
