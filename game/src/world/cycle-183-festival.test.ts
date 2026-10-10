import { describe, it, expect } from 'vitest';
import {
  festivalDue,
  festivalLeader,
  festivalMemory,
  festivalRing,
  festivalSulkers,
  openingLine,
  seasonIndex,
  zonesWithGuestsHome,
} from './festival';
import { foundingBonds, foundingGrudges } from './founding';
import { ROSTER } from '../entities/roster';
import type { Personality } from '../ai/personality';
import { deserialize, SAVE_VERSION } from './saveGame';

const t = (o: Partial<Personality>): Personality => ({ curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5, ...o });
const at = (day: number, hour: number, minute = 0) => ({ day, hour, minute });
const cast = ROSTER.map((r) => r.name);

describe('BACKLOG-596 the festival calendar', () => {
  it('is due on the first day of each season, mid-morning, once', () => {
    for (const day of [1, 8, 15, 22, 29]) expect(festivalDue(at(day, 10), -1)).toBe(seasonIndex(day));
    expect(festivalDue(at(1, 11, 59), -1)).toBe(0);
    expect(festivalDue(at(1, 9, 59), -1)).toBeNull();
    expect(festivalDue(at(1, 12), -1)).toBeNull();
    expect(festivalDue(at(2, 10), -1)).toBeNull();
    expect(festivalDue(at(1, 10), 0)).toBeNull();
    expect(festivalDue(at(29, 10), 3)).toBe(4);
  });

  it('a save taken mid-festival writes every guest home', () => {
    const zones = { Rex: 'bowl', Pip: 'bowl', Ember: 'bowl' };
    expect(zonesWithGuestsHome(zones, { Pip: { home: 'grove', tileX: 1, tileY: 1 }, Ember: { home: 'ridge', tileX: 2, tileY: 2 } })).toEqual({
      Rex: 'bowl',
      Pip: 'grove',
      Ember: 'ridge',
    });
    expect(zones.Pip).toBe('bowl');
  });

  it('festivalSeason rides the save, is absent on an old one, and a bad one is refused', () => {
    const save = { version: SAVE_VERSION, time: { day: 1, hour: 8, minute: 0 }, player: { x: 0, y: 0 } };
    expect(deserialize(JSON.stringify({ ...save, festivalSeason: 2 }))?.festivalSeason).toBe(2);
    expect(deserialize(JSON.stringify(save))?.festivalSeason).toBeUndefined();
    expect(deserialize(JSON.stringify({ ...save, festivalSeason: 'x' }))).toBeNull();
  });
});

describe('BACKLOG-594 who leads and who sulks', () => {
  it('on the founding park Sunny leads and the feud keeps to the edge', () => {
    const sulkers = festivalSulkers(cast, foundingGrudges());
    expect(sulkers).toEqual({ Mossback: 'Twitch', Twitch: 'Mossback' });
    expect(festivalLeader(cast, foundingBonds(), sulkers)).toBe('Sunny');
  });

  it('a sulker never leads, and strangers have no leader', () => {
    expect(festivalLeader(['A', 'B'], { 'A|B': 10 }, { A: 'C' })).toBe('B');
    expect(festivalLeader(['A', 'B'], {}, {})).toBeNull();
    expect(festivalSulkers(['A', 'B'], { 'A|C': 50 })).toEqual({});
  });

  it('rings: leader on the tile, the circle, the edge', () => {
    const s = { Twitch: 'Mossback' };
    expect([festivalRing('Sunny', 'Sunny', s), festivalRing('Rex', 'Sunny', s), festivalRing('Twitch', 'Sunny', s)]).toEqual([0, 1, 3]);
  });

  it('the opening line is in the leader’s register', () => {
    expect(openingLine('spring', t({ agreeableness: 0.1 }))).toBe("Fine. Everyone's here. It's spring. Let's get on with it.");
    expect(openingLine('winter', t({ sociability: 0.1 }))).toBe('...Winter, then. Good that you all came.');
    expect(openingLine('summer', t({}))).toBe("Everyone's here! Summer's come round again — come stand by the water!");
  });

  it('each attendee files its own day', () => {
    const s = { Mossback: 'Twitch' };
    expect(festivalMemory('Sunny', 'spring', 'Sunny', s)).toBe('opened the spring festival at the bowl pond');
    expect(festivalMemory('Mossback', 'spring', 'Sunny', s)).toBe('the spring festival — kept to the edge; Twitch was there');
    expect(festivalMemory('Rex', 'spring', 'Sunny', s)).toBe('the spring festival at the bowl pond — Sunny opened it');
    expect(festivalMemory('Rex', 'spring', null, {})).toBe('the spring festival at the bowl pond');
  });
});
