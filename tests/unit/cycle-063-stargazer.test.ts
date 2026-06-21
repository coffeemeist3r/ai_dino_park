import { describe, it, expect } from 'vitest';
import { gazeRing, GAZE_MAX_RING } from '../../game/src/world/skyEvent';

describe("stargazer's awe varies by temperament (BACKLOG-150)", () => {
  it('a bold, curious dino presses right under it (ring 0)', () => {
    expect(gazeRing({ bravery: 1, curiosity: 1 })).toBe(0);
    expect(gazeRing({ bravery: 0.7, curiosity: 0.6 })).toBe(0); // boldness 0.65 ≥ 0.6
  });

  it('a middling dino halts one ring out (ring 1)', () => {
    expect(gazeRing({ bravery: 0.4, curiosity: 0.4 })).toBe(1); // boldness 0.4
    expect(gazeRing({ bravery: 0.5, curiosity: 0.2 })).toBe(1); // boldness 0.35, lower boundary
  });

  it('a timid, incurious dino hangs back at the edge (ring 2)', () => {
    expect(gazeRing({ bravery: 0, curiosity: 0 })).toBe(GAZE_MAX_RING);
    expect(gazeRing({ bravery: 0.3, curiosity: 0.3 })).toBe(2); // boldness 0.3 < 0.35
  });

  it('the boundaries fall on the bold side (≥, not >)', () => {
    expect(gazeRing({ bravery: 0.6, curiosity: 0.6 })).toBe(0); // exactly 0.6 → ring 0
    expect(gazeRing({ bravery: 0.35, curiosity: 0.35 })).toBe(1); // exactly 0.35 → ring 1
  });

  it('always returns a valid ring 0..2', () => {
    for (let b = 0; b <= 1; b += 0.1) {
      for (let c = 0; c <= 1; c += 0.1) {
        const r = gazeRing({ bravery: b, curiosity: c });
        expect(r).toBeGreaterThanOrEqual(0);
        expect(r).toBeLessThanOrEqual(GAZE_MAX_RING);
      }
    }
  });
});
