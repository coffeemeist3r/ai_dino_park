import { describe, it, expect } from 'vitest';
import { distanceGain, NEAR_PX, FAR_PX, FAR_LEVEL } from './space';
import { gainFor, VOICE_KINDS } from './mix';

/**
 * BACKLOG-206 — sound has a place.
 *
 * Two things are pinned here and they pull in opposite directions on purpose: a call *does* get
 * quieter with distance, and it *never* reaches zero. The second is the one worth a test of its own.
 */

describe('distanceGain', () => {
  it('is unattenuated at the keeper and out to the near radius', () => {
    expect(distanceGain(0)).toBe(1);
    expect(distanceGain(NEAR_PX / 2)).toBe(1);
    expect(distanceGain(NEAR_PX)).toBe(1);
  });

  it('bottoms out at the floor and stays there', () => {
    expect(distanceGain(FAR_PX)).toBe(FAR_LEVEL);
    expect(distanceGain(FAR_PX * 3)).toBe(FAR_LEVEL);
  });

  it('is monotone non-increasing across the whole range', () => {
    let prev = distanceGain(0);
    for (let d = 0; d <= FAR_PX * 1.5; d += 8) {
      const g = distanceGain(d);
      expect(g).toBeLessThanOrEqual(prev + 1e-9);
      prev = g;
    }
  });

  it('actually attenuates somewhere a player can stand', () => {
    // The point of the curve: between near and far it is strictly between the two levels, so the
    // falloff is something the 640x480 ground demonstrates rather than a constant with extra steps.
    const mid = distanceGain((NEAR_PX + FAR_PX) / 2);
    expect(mid).toBeLessThan(1);
    expect(mid).toBeGreaterThan(FAR_LEVEL);
  });

  it('never silences a call — the floor is a design commitment, not leftover arithmetic', () => {
    expect(FAR_LEVEL).toBeGreaterThan(0);
    for (let d = 0; d <= FAR_PX * 2; d += 16) expect(distanceGain(d)).toBeGreaterThan(0);
  });

  it('returns full level for input that is not a distance', () => {
    // A NaN should make the park sound wrong in a way somebody notices, not swallow its own voices.
    expect(distanceGain(NaN)).toBe(1);
    expect(distanceGain(Infinity)).toBe(1);
    expect(distanceGain(-1)).toBe(1);
  });
});

describe('gainFor with distance', () => {
  it('is the identity case for every kind when no distance is given', () => {
    // The cycle-168 numbers, pinned by name. Walking the union rather than trusting the type: a kind
    // added without a level fails here instead of returning undefined at a call site.
    const expected: Record<string, number> = { chirp: 0.12, thunk: 0.12 * 1.4, hail: 0.08, distress: 0.2 };
    for (const kind of VOICE_KINDS) {
      expect(gainFor(kind)).toBeCloseTo(expected[kind], 10);
      expect(gainFor(kind, {})).toBeCloseTo(expected[kind], 10);
    }
  });

  it('multiplies the kind level by the falloff', () => {
    for (const kind of VOICE_KINDS) {
      for (const d of [0, NEAR_PX, 200, FAR_PX, 1000]) {
        expect(gainFor(kind, { distancePx: d })).toBeCloseTo(gainFor(kind) * distanceGain(d), 10);
      }
    }
  });

  it('makes a far cry quieter than a near one, and still audible', () => {
    const near = gainFor('distress', { distancePx: 0 });
    const far = gainFor('distress', { distancePx: FAR_PX });
    expect(far).toBeLessThan(near);
    expect(far).toBeGreaterThan(0);
  });
});
