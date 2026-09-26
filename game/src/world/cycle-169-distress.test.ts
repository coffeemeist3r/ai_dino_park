import { describe, it, expect } from 'vitest';
import { distressEventLine, callbackDelayMs, CALLBACK_SLOW_MS, CALLBACK_FAST_MS } from './distress';

/**
 * BACKLOG-204 + BACKLOG-202 — a cry you can find, and a cry that is answered.
 */

describe('distressEventLine', () => {
  it('names the caller and the ground to find them on', () => {
    const line = distressEventLine('Rex', 'startle', 'the main tank');
    expect(line).toContain('Rex');
    expect(line).toContain('the main tank');
    expect(line.startsWith('📢')).toBe(true);
  });

  it('reads differently for the two kinds of trouble', () => {
    const startled = distressEventLine('Rex', 'startle', 'the grove');
    const cold = distressEventLine('Rex', 'cold', 'the grove');
    expect(startled).not.toBe(cold);
    expect(cold).toContain('shivering');
  });
});

describe('callbackDelayMs', () => {
  it('a close friend answers faster than a distant one', () => {
    expect(callbackDelayMs(100)).toBeLessThan(callbackDelayMs(0));
  });

  it('is monotone non-increasing in bond points', () => {
    let prev = callbackDelayMs(0);
    for (let b = 0; b <= 100; b += 5) {
      const d = callbackDelayMs(b);
      expect(d).toBeLessThanOrEqual(prev);
      prev = d;
    }
  });

  it('clamps at both ends', () => {
    expect(callbackDelayMs(-50)).toBe(CALLBACK_SLOW_MS);
    expect(callbackDelayMs(0)).toBe(CALLBACK_SLOW_MS);
    expect(callbackDelayMs(100)).toBe(CALLBACK_FAST_MS);
    expect(callbackDelayMs(9999)).toBe(CALLBACK_FAST_MS);
  });

  it('is never zero — an answer needs a gap to be one', () => {
    for (let b = 0; b <= 120; b += 3) expect(callbackDelayMs(b)).toBeGreaterThan(0);
  });
});
