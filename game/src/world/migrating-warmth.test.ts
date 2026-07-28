import { describe, it, expect } from 'vitest';
import { seasonSocialBias, seasonalSocializeChance, SEASONS } from './seasons';
import { SOCIALIZE_BASE } from '../ai/intent';

/**
 * Migrating warmth (BACKLOG-178) — the year's grip on the bowl's daytime social density. Winter tightens the
 * drift-to-the-cluster roll, summer loosens it, spring/fall are the neutral hinges. Pure per-season modifier,
 * the social twin of 461's `seasonGrip`; WorldScene threads it onto the socialize roll, clamped.
 */

describe('seasonSocialBias (BACKLOG-178)', () => {
  it('tightens in winter, loosens in summer, is neutral spring/fall', () => {
    expect(seasonSocialBias('winter')).toBeGreaterThan(1);
    expect(seasonSocialBias('summer')).toBeLessThan(1);
    expect(seasonSocialBias('spring')).toBe(1);
    expect(seasonSocialBias('fall')).toBe(1);
  });

  it('covers every season (no undefined bias)', () => {
    for (const s of SEASONS) expect(seasonSocialBias(s)).toBeGreaterThan(0);
  });
});

describe('seasonalSocializeChance (BACKLOG-178)', () => {
  it('leaves the neutral seasons byte-identical to the base (spring = default)', () => {
    expect(seasonalSocializeChance(SOCIALIZE_BASE, 'spring')).toBe(SOCIALIZE_BASE);
    expect(seasonalSocializeChance(0.3, 'fall')).toBe(0.3);
  });

  it('winter clusters more than summer for the same base', () => {
    expect(seasonalSocializeChance(SOCIALIZE_BASE, 'winter')).toBeGreaterThan(
      seasonalSocializeChance(SOCIALIZE_BASE, 'summer'),
    );
  });

  it('never escapes the [0.05, 0.95] band, whatever the base × season', () => {
    // A high base × the winter multiplier can't peg the roll to always...
    expect(seasonalSocializeChance(0.9, 'winter')).toBeLessThanOrEqual(0.95);
    // ...and a low base × the summer multiplier can't freeze it to never.
    expect(seasonalSocializeChance(0.06, 'summer')).toBeGreaterThanOrEqual(0.05);
    for (const s of SEASONS) {
      for (const base of [0.05, 0.2, 0.45, 0.65, 0.95]) {
        const c = seasonalSocializeChance(base, s);
        expect(c).toBeGreaterThanOrEqual(0.05);
        expect(c).toBeLessThanOrEqual(0.95);
      }
    }
  });
});
