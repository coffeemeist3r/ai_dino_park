import { describe, it, expect } from 'vitest';
import { tintFor, dayPhase } from '../../game/src/world/dayNight';

const red = (c: number) => (c >> 16) & 0xff;
const blue = (c: number) => c & 0xff;

describe('tintFor', () => {
  it('noon is effectively clear', () => {
    expect(tintFor({ day: 1, hour: 12, minute: 0 }).alpha).toBeLessThanOrEqual(0.05);
  });

  it('midnight is a dark blue tint', () => {
    const t = tintFor({ day: 1, hour: 0, minute: 0 });
    expect(t.alpha).toBeGreaterThanOrEqual(0.45);
    expect(blue(t.color)).toBeGreaterThan(red(t.color));
  });

  it('dawn (07:00) is warm at moderate alpha', () => {
    const t = tintFor({ day: 1, hour: 7, minute: 0 });
    expect(red(t.color)).toBeGreaterThan(blue(t.color));
    expect(t.alpha).toBeGreaterThanOrEqual(0.1);
    expect(t.alpha).toBeLessThanOrEqual(0.45);
  });

  it('dusk (19:00) is warm at moderate alpha', () => {
    const t = tintFor({ day: 1, hour: 19, minute: 0 });
    expect(red(t.color)).toBeGreaterThan(blue(t.color));
    expect(t.alpha).toBeGreaterThanOrEqual(0.1);
    expect(t.alpha).toBeLessThanOrEqual(0.45);
  });

  it('is continuous — alpha never jumps > 0.05 between adjacent minutes (incl. midnight wrap)', () => {
    let prev = tintFor({ day: 1, hour: 0, minute: 0 }).alpha;
    for (let m = 1; m <= 1440; m++) {
      const cur = tintFor({ day: 1, hour: Math.floor(m / 60) % 24, minute: m % 60 }).alpha;
      expect(Math.abs(cur - prev)).toBeLessThanOrEqual(0.05);
      prev = cur;
    }
  });
});

describe('dayPhase', () => {
  it('labels sample hours', () => {
    expect(dayPhase(2)).toBe('night');
    expect(dayPhase(6)).toBe('dawn');
    expect(dayPhase(12)).toBe('day');
    expect(dayPhase(19)).toBe('dusk');
    expect(dayPhase(23)).toBe('night');
  });
});
