import { describe, it, expect } from 'vitest';
import { SEASONS, seasonThirst, slakeFloor, seasonThirstLine, SUMMER_SLAKE_FLOOR } from './seasons';
import { advanceNeeds, satisfy, thirstRate, NEED_THRESHOLD, type Needs } from './needs';
import type { Personality } from '../ai/personality';

/**
 * The dry season (BACKLOG-466) — the year's grip on drinking. The lean-season suite (461) is the template:
 * pin the hinges *exactly*, because "spring and fall are 1.0" is a compatibility promise (a fresh clock
 * behaves as it did before this existed), not a tuning choice.
 */

const traits = { energy: 0.5 } as Personality;
const entries = [{ name: 'Moss', traits }];

describe('seasonThirst', () => {
  it('leaves the hinges of the year exactly alone', () => {
    expect(seasonThirst('spring')).toBe(1);
    expect(seasonThirst('fall')).toBe(1);
  });

  it('parches in summer and eases in winter', () => {
    expect(seasonThirst('summer')).toBeGreaterThan(1);
    expect(seasonThirst('winter')).toBeLessThan(1);
  });

  it('answers for every season in the year', () => {
    for (const s of SEASONS) expect(Number.isFinite(seasonThirst(s))).toBe(true);
  });
});

describe('slakeFloor', () => {
  it('leaves a drink unfinished only in the dry season', () => {
    expect(slakeFloor('summer')).toBe(SUMMER_SLAKE_FLOOR);
    expect(slakeFloor('spring')).toBe(0);
    expect(slakeFloor('fall')).toBe(0);
    expect(slakeFloor('winter')).toBe(0);
  });

  it('leaves a summer drink worth taking', () => {
    expect(SUMMER_SLAKE_FLOOR).toBeGreaterThan(0);
    expect(SUMMER_SLAKE_FLOOR).toBeLessThan(NEED_THRESHOLD);
  });
});

describe('seasonThirstLine', () => {
  it('announces the seasons that shift the drinking and stays quiet on the hinges', () => {
    expect(seasonThirstLine('summer')).not.toBe('');
    expect(seasonThirstLine('winter')).not.toBe('');
    expect(seasonThirstLine('spring')).toBe('');
    expect(seasonThirstLine('fall')).toBe('');
  });
});

describe('the grip on the needs tick', () => {
  const run = (mul?: number): Needs => advanceNeeds({}, entries, 20, mul);

  it('is inert by default — the pre-466 path, byte for byte', () => {
    expect(run()).toEqual(run(1));
    expect(thirstRate(traits)).toBe(thirstRate(traits, 1));
  });

  it('leaves a dino thirstier in summer than in spring, and least thirsty in winter', () => {
    const summer = run(seasonThirst('summer')).Moss.thirst;
    const spring = run(seasonThirst('spring')).Moss.thirst;
    const winter = run(seasonThirst('winter')).Moss.thirst;
    expect(summer).toBeGreaterThan(spring);
    expect(spring).toBeGreaterThan(winter);
  });

  it('reaches thirst only — hunger is the same in every season', () => {
    const hunger = (s: (typeof SEASONS)[number]) => run(seasonThirst(s)).Moss.hunger;
    expect(hunger('summer')).toBe(hunger('winter'));
    expect(hunger('summer')).toBe(hunger('spring'));
  });

  it('still clamps at parched — the dry season quickens thirst, it does not overflow it', () => {
    const long = advanceNeeds({}, entries, 100_000, seasonThirst('summer'));
    expect(long.Moss.thirst).toBe(1);
  });
});

describe('the grip on the drink', () => {
  const parched: Needs = { Moss: { hunger: 0.4, thirst: 0.9 } };

  it('slakes completely with no floor given — every hunger caller keeps this path', () => {
    expect(satisfy(parched, 'Moss', 'thirst').Moss.thirst).toBe(0);
    expect(satisfy(parched, 'Moss', 'hunger').Moss.hunger).toBe(0);
  });

  it('leaves a summer drink short of full', () => {
    expect(satisfy(parched, 'Moss', 'thirst', slakeFloor('summer')).Moss.thirst).toBe(SUMMER_SLAKE_FLOOR);
    expect(satisfy(parched, 'Moss', 'thirst', slakeFloor('spring')).Moss.thirst).toBe(0);
  });

  it('leaves the other need untouched whatever the floor', () => {
    expect(satisfy(parched, 'Moss', 'thirst', slakeFloor('summer')).Moss.hunger).toBe(0.4);
  });
});
