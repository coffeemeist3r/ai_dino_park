import { describe, it, expect } from 'vitest';
import { isIdle, hudAlpha, IDLE_AFTER_MS, FADE_MS, AMBIENT_ALPHA } from '../../game/src/world/idle';

describe('isIdle', () => {
  it('flips only at/after the idle threshold', () => {
    expect(isIdle(0)).toBe(false);
    expect(isIdle(IDLE_AFTER_MS - 1)).toBe(false);
    expect(isIdle(IDLE_AFTER_MS)).toBe(true);
    expect(isIdle(IDLE_AFTER_MS + 5_000)).toBe(true);
  });
});

describe('hudAlpha', () => {
  it('is fully opaque until the idle threshold', () => {
    expect(hudAlpha(0)).toBe(1);
    expect(hudAlpha(IDLE_AFTER_MS)).toBe(1);
  });

  it('eases down to AMBIENT_ALPHA across the fade window', () => {
    expect(hudAlpha(IDLE_AFTER_MS + FADE_MS / 2)).toBeCloseTo(1 + 0.5 * (AMBIENT_ALPHA - 1), 5);
    expect(hudAlpha(IDLE_AFTER_MS + FADE_MS)).toBeCloseTo(AMBIENT_ALPHA, 5);
  });

  it('clamps at AMBIENT_ALPHA once fully faded', () => {
    expect(hudAlpha(IDLE_AFTER_MS + FADE_MS * 10)).toBe(AMBIENT_ALPHA);
  });

  it('is monotonically non-increasing', () => {
    let prev = hudAlpha(0);
    for (let ms = 0; ms <= IDLE_AFTER_MS + FADE_MS * 2; ms += 250) {
      const a = hudAlpha(ms);
      expect(a).toBeLessThanOrEqual(prev + 1e-9);
      prev = a;
    }
  });
});
