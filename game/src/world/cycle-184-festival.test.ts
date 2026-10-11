import { describe, it, expect } from 'vitest';
import {
  FESTIVAL_ART_KEYS,
  festivalBanner,
  festivalClosedLine,
  festivalMemory,
  festivalOpener,
  festivalRite,
} from './festival';
import { worldPlacedProps } from './reachability';
import type { Personality } from '../ai/personality';

const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;
const traits = (o: Partial<Personality>): Personality =>
  ({ bravery: 0.5, curiosity: 0.5, sociability: 0.5, agreeableness: 0.5, energy: 0.5, ...o }) as Personality;

describe('BACKLOG-597 — each season has its own rite', () => {
  it('four distinct rites, glyphs, marks and bubbles', () => {
    for (const k of ['name', 'glyph', 'artKey', 'bubble'] as const) {
      expect(new Set(SEASONS.map((s) => festivalRite(s)[k])).size).toBe(4);
    }
    expect(festivalRite('spring').name).toBe('blossom ring');
    expect(festivalRite('winter').name).toBe('lantern vigil');
  });

  it('banner and closing line carry the season glyph and rite', () => {
    expect(festivalBanner('spring')).toBe('🌸 The spring festival — a blossom ring at the bowl pond');
    expect(festivalBanner('winter')).toBe('🏮 The winter festival — a lantern vigil at the bowl pond');
    expect(festivalClosedLine('fall')).toBe('🍂 The fall festival is over — the guests head home');
  });

  it('the memory names the rite for leader and circle, not the sulker', () => {
    const s = { Mossback: 'Twitch' };
    expect(festivalMemory('Sunny', 'summer', 'Sunny', s)).toBe('opened the summer festival — led the sun dance');
    expect(festivalMemory('Rex', 'fall', 'Sunny', s)).toBe('the fall festival — the harvest heap; Sunny opened it');
    expect(festivalMemory('Mossback', 'fall', 'Sunny', s)).toBe('the fall festival — kept to the edge; Twitch was there');
  });

  it('every season mark is a placed prop', () => {
    const placed = worldPlacedProps();
    for (const k of FESTIVAL_ART_KEYS) expect(placed.has(k), k).toBe(true);
  });
});

describe('BACKLOG-595 — the festival, remembered', () => {
  const tale = { season: 'spring' as const, leader: 'Sunny' };
  it('the leader is proud, a prickly leader grudging', () => {
    expect(festivalOpener('Sunny', tale)).toBe('I opened the spring festival. Everyone came to the blossom ring.');
    expect(festivalOpener('Sunny', tale, traits({ agreeableness: 0.1 }))).toBe('Somebody had to open the spring festival. It went fine.');
  });
  it('a sulker is sore about its foe', () => {
    expect(festivalOpener('Mossback', { ...tale, foe: 'Twitch' })).toBe('The spring festival. Twitch was there, so I kept to the edge.');
  });
  it('warm, solitary and prickly circle dinos each read it their own way', () => {
    expect(festivalOpener('Rex', tale)).toBe('The spring festival was lovely — Sunny opened the blossom ring.');
    expect(festivalOpener('Rex', tale, traits({ sociability: 0.1 }))).toBe("The spring festival's over. Good. That was a lot of dinos.");
    expect(festivalOpener('Rex', tale, traits({ agreeableness: 0.1 }))).toBe('The spring festival. Sunny opened it. It was fine, I suppose.');
    expect(festivalOpener('Rex', { season: 'winter', leader: null })).toBe('The winter festival was lovely.');
  });
});
