import { describe, it, expect } from 'vitest';
import { COLD_SEASON, sleptCold, coldShiver, coldMemory } from '../../game/src/world/cold';
import { SEASONS, type Season } from '../../game/src/world/seasons';

const WARM: Season[] = SEASONS.filter((s) => s !== COLD_SEASON);

describe('cold-night shiver (BACKLOG-179)', () => {
  it('a winter night never huddled sleeps cold', () => {
    expect(sleptCold(false, 'winter')).toBe(true);
  });

  it('a winter night that did huddle is warm', () => {
    expect(sleptCold(true, 'winter')).toBe(false);
  });

  it('warm seasons never leave a sleeper cold, huddled or not', () => {
    for (const s of WARM) {
      expect(sleptCold(false, s)).toBe(false);
      expect(sleptCold(true, s)).toBe(false);
    }
  });

  it('huddling is never cold in any season', () => {
    for (const s of SEASONS) expect(sleptCold(true, s)).toBe(false);
  });

  it('only winter is the cold season', () => {
    expect(COLD_SEASON).toBe('winter');
  });

  it('the shiver bubble and the stored memory are distinct, non-empty, and both freezing', () => {
    expect(coldShiver().length).toBeGreaterThan(0);
    expect(coldMemory().length).toBeGreaterThan(0);
    expect(coldShiver()).toContain('🥶');
    expect(coldMemory()).toContain('🥶');
    expect(coldShiver()).not.toBe(coldMemory());
  });
});
