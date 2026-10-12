import { describe, it, expect } from 'vitest';
import {
  FAIR_ART_KEY,
  RING_BOND,
  fairLine,
  fairMemory,
  fairTrade,
  festivalOpener,
  ringFriendLine,
  ringFriends,
  ringPairs,
} from './festival';
import { worldPlacedProps } from './reachability';
import { barterSwap, structureRecipe } from './resource';
import { bondPoints } from '../social/bonds';
import { LONER_FLOOR } from './loner';
import { BOWL_ID, GROVE_ID, RIDGE_ID } from './zones';
import type { Personality } from '../ai/personality';

const traits = (o: Partial<Personality>): Personality =>
  ({ bravery: 0.5, curiosity: 0.5, sociability: 0.5, agreeableness: 0.5, energy: 0.5, ...o }) as Personality;

describe('BACKLOG-599 — the festival fair', () => {
  it('trades by each ground’s own recipe (the 358 barter)', () => {
    const grove = { stone: 2 };
    const bowl = { branch: 1 };
    expect(fairTrade(GROVE_ID, grove, bowl)).toEqual(barterSwap(grove, bowl, structureRecipe(GROVE_ID), structureRecipe(BOWL_ID)));
    expect(fairTrade(RIDGE_ID, { obsidian: 3 }, {}).aGives).toBe('obsidian');
    expect(fairTrade(RIDGE_ID, {}, {})).toEqual({ aGives: null, bGives: null });
  });

  it('a line for each shape of trade, none for nothing', () => {
    expect(fairLine('Bramble', 'The Grove', 'stone', 'branch')).toBe('🧺 Bramble brought 🪨 from The Grove and took 🪵 home');
    expect(fairLine('Ember', 'The Sunward Ridge', 'obsidian', null)).toBe('🧺 Ember brought 🌑 from The Sunward Ridge');
    expect(fairLine('Murk', 'The Hollow', null, 'branch')).toBe('🧺 Murk took 🪵 home to The Hollow');
    expect(fairLine('Murk', 'The Hollow', null, null)).toBeNull();
    expect(fairMemory('spring', 'stone', null)).toBe('the spring festival fair — brought 🪨');
    expect(fairMemory('spring', 'stone', 'branch')).toBe('the spring festival fair — brought 🪨, took 🪵');
  });

  it('the basket is a placed prop', () => {
    expect(worldPlacedProps().has(FAIR_ART_KEY)).toBe(true);
  });
});

describe('BACKLOG-180 — odd bedfellows at the ring', () => {
  it('pairs are the dinos within one tile, each once', () => {
    const pairs = ringPairs({ Rex: { tileX: 6, tileY: 4 }, Pip: { tileX: 7, tileY: 5 }, Glade: { tileX: 5, tileY: 4 }, Murk: { tileX: 9, tileY: 4 } });
    expect(pairs).toEqual([
      ['Glade', 'Rex'],
      ['Pip', 'Rex'],
    ]);
  });

  it('every pair gains the ring bond; only floor-crossers are new friends', () => {
    const { bonds, crossed } = ringFriends({ 'Pip|Rex': 30 }, [
      ['Pip', 'Rex'],
      ['Glade', 'Rex'],
    ]);
    expect(bondPoints(bonds, 'Pip', 'Rex')).toBe(30 + RING_BOND);
    expect(bondPoints(bonds, 'Glade', 'Rex')).toBe(RING_BOND);
    expect(RING_BOND).toBeGreaterThanOrEqual(LONER_FLOOR);
    expect(crossed).toEqual([['Glade', 'Rex']]);
  });

  it('the tale names the friend, in the dino’s register', () => {
    const tale = { season: 'spring' as const, leader: 'Sunny', friend: 'Twitch' };
    expect(festivalOpener('Rex', tale)).toBe('The spring festival was lovely — Sunny opened the blossom ring. I stood next to Twitch in the ring — we\'re friends now.');
    expect(ringFriendLine('Twitch', traits({ agreeableness: 0.1 }))).toBe('Stood next to Twitch the whole time. Twitch is alright.');
    expect(ringFriendLine('Twitch', traits({ sociability: 0.1 }))).toBe("Twitch stood by me. I didn't mind.");
    expect(festivalOpener('Rex', { season: 'spring', leader: 'Sunny' })).not.toContain('friends now');
  });
});
