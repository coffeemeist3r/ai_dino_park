import { describe, it, expect } from 'vitest';
import {
  advanceNeeds,
  pressingNeed,
  satisfy,
  hungerRate,
  thirstRate,
  NEED_THRESHOLD,
  NEED_GLYPH,
  type Needs,
} from '../../game/src/world/needs';
import type { Personality } from '../../game/src/ai/personality';

const calm: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.1, agreeableness: 0.5, bravery: 0.5 };
const eager: Personality = { ...calm, energy: 0.9 };

describe('need-drive spine (BACKLOG-371)', () => {
  it('a fresh dino starts sated and both needs build over steps, clamped to 1', () => {
    let n: Needs = {};
    n = advanceNeeds(n, [{ name: 'Rex', traits: calm }], 1);
    expect(n.Rex.hunger).toBeGreaterThan(0);
    expect(n.Rex.thirst).toBeGreaterThan(0);
    // many steps pin at 1, never beyond
    n = advanceNeeds(n, [{ name: 'Rex', traits: calm }], 10_000);
    expect(n.Rex.hunger).toBe(1);
    expect(n.Rex.thirst).toBe(1);
  });

  it('hunger builds faster than thirst, and a higher-energy dino burns through both faster', () => {
    expect(hungerRate(calm)).toBeGreaterThan(thirstRate(calm)); // thirst is the rarer 💧
    expect(hungerRate(eager)).toBeGreaterThan(hungerRate(calm));
    expect(thirstRate(eager)).toBeGreaterThan(thirstRate(calm));
  });

  it('pressingNeed is null below the threshold, the larger need above it, thirst on a tie', () => {
    expect(pressingNeed({ hunger: 0, thirst: 0 })).toBeNull();
    expect(pressingNeed({ hunger: NEED_THRESHOLD - 0.01, thirst: NEED_THRESHOLD - 0.01 })).toBeNull();
    expect(pressingNeed({ hunger: 0.9, thirst: 0.7 })).toBe('hunger');
    expect(pressingNeed({ hunger: 0.7, thirst: 0.9 })).toBe('thirst');
    expect(pressingNeed({ hunger: 0.8, thirst: 0.8 })).toBe('thirst'); // tie → thirst
    expect(pressingNeed(undefined)).toBeNull();
    expect(NEED_GLYPH.hunger).not.toBe(NEED_GLYPH.thirst);
  });

  it('satisfy zeroes exactly one need and leaves the other untouched', () => {
    const n: Needs = { Rex: { hunger: 0.9, thirst: 0.8 } };
    expect(satisfy(n, 'Rex', 'hunger').Rex).toEqual({ hunger: 0, thirst: 0.8 });
    expect(satisfy(n, 'Rex', 'thirst').Rex).toEqual({ hunger: 0.9, thirst: 0 });
    expect(n.Rex).toEqual({ hunger: 0.9, thirst: 0.8 }); // input not mutated
  });

  it('is deathless: advancing needs never removes a dino from the map', () => {
    let n: Needs = { Rex: { hunger: 0.99, thirst: 0.99 }, Sunny: { hunger: 0, thirst: 0 } };
    n = advanceNeeds(n, [{ name: 'Rex', traits: eager }, { name: 'Sunny', traits: calm }], 10_000);
    expect(Object.keys(n).sort()).toEqual(['Rex', 'Sunny']);
    expect(n.Rex.hunger).toBe(1); // pinned, but Rex still exists — no decay-to-death
  });
});
