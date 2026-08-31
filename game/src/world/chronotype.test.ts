import { describe, it, expect } from 'vitest';
import { seededPersonality } from '../ai/personality';
import { ROSTER } from '../entities/roster';
import { SEASON_HUDDLE } from './huddle';
import type { Season } from './seasons';
import {
  owlishness,
  chronotypeOf,
  restWindow,
  atRest,
  awakeAtNight,
  chronotypeLine,
  OWL_BAR,
  OWL_SHIFT,
} from './chronotype';

const SEASONS: Season[] = ['spring', 'summer', 'fall', 'winter'];
const typeOf = (name: string) => chronotypeOf(seededPersonality(name));

describe('BACKLOG-109 — the derivation', () => {
  it('splits the ten roster names 4 owls / 6 day-dinos', () => {
    const owls = ROSTER.filter((r) => typeOf(r.name) === 'owl').map((r) => r.name);
    expect(owls.sort()).toEqual(['Ember', 'Pip', 'Rex', 'Thornback']);
    expect(ROSTER.length - owls.length).toBe(6);
  });

  it('puts an owl in the founding park, on the ground a fresh save opens on', () => {
    // The reachability constraint, asserted over the live roster rather than over a literal: a fresh save
    // opens in the Bowl at 08:00, and if every Bowl dino were a day-dino the split would be invisible for
    // the first twelve real minutes — outside the ten-minute bar. CHARTER v7's corollary, pinned.
    const bowl = ROSTER.filter((r) => !r.zone);
    expect(bowl.length).toBeGreaterThan(0);
    expect(bowl.some((r) => typeOf(r.name) === 'owl')).toBe(true);
  });

  it('clears the bar with a real margin on both sides — no roster dino is a coin flip', () => {
    for (const r of ROSTER) {
      expect(Math.abs(owlishness(seededPersonality(r.name)) - OWL_BAR)).toBeGreaterThan(0.04);
    }
  });

  it('is deterministic and model-free — same name, same answer', () => {
    expect(typeOf('Rex')).toBe('owl');
    expect(typeOf('Sunny')).toBe('day');
    expect(typeOf('Rex')).toBe(typeOf('Rex'));
  });
});

describe('BACKLOG-109 — the windows', () => {
  it('leaves a day-dino on the season table exactly', () => {
    for (const s of SEASONS) {
      expect(restWindow('day', s)).toEqual({ start: SEASON_HUDDLE[s].start, end: SEASON_HUDDLE[s].end });
    }
  });

  it('shifts an owl by OWL_SHIFT hours, every season', () => {
    for (const s of SEASONS) {
      expect(restWindow('owl', s)).toEqual({
        start: (SEASON_HUDDLE[s].start + OWL_SHIFT) % 24,
        end: (SEASON_HUDDLE[s].end + OWL_SHIFT) % 24,
      });
    }
  });

  it('keeps the legacy night window when no season is given', () => {
    expect(restWindow('day')).toEqual({ start: 21, end: 5 });
  });

  it('has the owl down at the hour a fresh save opens, and the day-dino up', () => {
    expect(atRest(8, 'owl', 'spring')).toBe(true);
    expect(atRest(8, 'day', 'spring')).toBe(false);
  });

  it('has the day-dino down at night, and the owl up', () => {
    expect(atRest(23, 'day', 'spring')).toBe(true);
    expect(atRest(23, 'owl', 'spring')).toBe(false);
  });

  it('overlaps — the two halves of the cast are awake together for part of the day', () => {
    const both = [...Array(24).keys()].filter((h) => !atRest(h, 'day', 'spring') && !atRest(h, 'owl', 'spring'));
    expect(both.length).toBeGreaterThan(0);
  });

  it('only ever calls an owl awake at night', () => {
    for (let h = 0; h < 24; h++) expect(awakeAtNight(h, 'day', 'spring')).toBe(false);
    expect([...Array(24).keys()].some((h) => awakeAtNight(h, 'owl', 'spring'))).toBe(true);
  });
});

describe('BACKLOG-109 — the book standing', () => {
  it('names both hours', () => {
    expect(chronotypeLine('owl')).toBe('keeps late hours');
    expect(chronotypeLine('day')).toBe('up with the sun');
  });
});
