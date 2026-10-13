import { describe, it, expect } from 'vitest';
import {
  coaxAnswer,
  coaxLine,
  coaxMemory,
  coaxOrder,
  coaxTicker,
  festivalOpener,
  KEEPER_FESTIVAL_GAIN,
  keeperInRing,
  keeperTaleLine,
  keeperWelcome,
} from './festival';
import { strengthen } from '../social/bonds';
import { BASE_GAIN } from '../social/friendship';
import type { Personality } from '../ai/personality';

const traits = (o: Partial<Personality>): Personality =>
  ({ bravery: 0.5, curiosity: 0.5, sociability: 0.5, agreeableness: 0.5, energy: 0.5, ...o }) as Personality;

describe('BACKLOG-133 — the leader fetches the sulkers', () => {
  const sulkers = { Mossback: 'Twitch', Twitch: 'Mossback' };

  it('walks out to the most-bonded sulker first, then by name', () => {
    expect(coaxOrder('Sunny', sulkers, {})).toEqual(['Mossback', 'Twitch']);
    expect(coaxOrder('Sunny', sulkers, strengthen({}, 'Sunny', 'Twitch', 5))).toEqual(['Twitch', 'Mossback']);
  });

  it('a prickly leader, or no leader, fetches nobody', () => {
    expect(coaxOrder('Rex', sulkers, {}, traits({ agreeableness: 0.2 }))).toEqual([]);
    expect(coaxOrder(null, sulkers, {})).toEqual([]);
  });

  it('a sulker comes in unless it is prickly, and a refusal names the foe', () => {
    expect(coaxAnswer('Mossback', traits({ agreeableness: 0.9 }))).toEqual({ comes: true, line: 'Oh — alright!' });
    expect(coaxAnswer('Mossback', traits({ agreeableness: 0.9, sociability: 0.1 })).line).toBe('...alright. Just for a bit.');
    expect(coaxAnswer('Twitch', traits({ agreeableness: 0.2 }))).toEqual({ comes: false, line: "😤 Not while Twitch's in there." });
  });

  it('the ask, ticker and memories', () => {
    expect(coaxLine('Twitch', 'spring')).toBe("Come on, Twitch — it's spring. Stand with us.");
    expect(coaxLine('Twitch', 'spring', traits({ sociability: 0.1 }))).toBe("...Twitch? There's room by me.");
    expect(coaxTicker('Sunny', 'Twitch', true)).toBe('🤝 Sunny fetched Twitch in from the edge');
    expect(coaxTicker('Sunny', 'Mossback', false)).toBe("😤 Mossback wouldn't come in from the edge");
    expect(coaxMemory('spring', 'Twitch', true, true)).toBe('the spring festival — brought Twitch in from the edge');
    expect(coaxMemory('spring', 'Sunny', false, false)).toBe('the spring festival — Sunny came for me; I stayed out');
  });

  it('the tales tell it: fetched, refused, and the leader who brought one in', () => {
    expect(festivalOpener('Twitch', { season: 'spring', leader: 'Sunny', fetchedBy: 'Sunny' })).toBe(
      'The spring festival. I was keeping to the edge, but Sunny came and fetched me in.',
    );
    expect(festivalOpener('Mossback', { season: 'spring', leader: 'Sunny', foe: 'Twitch', refused: true })).toBe(
      'The spring festival. Twitch was there, so I kept to the edge. Sunny came to fetch me. No.',
    );
    expect(festivalOpener('Sunny', { season: 'spring', leader: 'Sunny', broughtIn: ['Twitch'] })).toBe(
      'I opened the spring festival. Everyone came to the blossom ring. Twitch came in from the edge, too.',
    );
  });
});

describe('BACKLOG-600 — the keeper in the ring', () => {
  it('counts within the outer ring of the festival tile', () => {
    expect(keeperInRing({ tileX: 6, tileY: 4 })).toBe(true);
    expect(keeperInRing({ tileX: 9, tileY: 1 })).toBe(true);
    expect(keeperInRing({ tileX: 10, tileY: 4 })).toBe(false);
    expect(keeperInRing({ tileX: 6, tileY: 8 })).toBe(false);
  });

  it('the welcome is in the leader’s register', () => {
    expect(keeperWelcome('Aki')).toBe('The keeper came too! Come stand with us, Aki!');
    expect(keeperWelcome('Aki', traits({ agreeableness: 0.2 }))).toBe('Oh. The keeper. Fine — stand there, then.');
    expect(keeperWelcome('Aki', traits({ sociability: 0.2 }))).toBe('...You came. Good.');
    expect(KEEPER_FESTIVAL_GAIN).toBe(BASE_GAIN);
  });

  it('the tale ends on whether the keeper came, and is unchanged when it never asked', () => {
    const tale = { season: 'spring' as const, leader: 'Sunny' };
    const plain = festivalOpener('Pip', tale);
    expect(festivalOpener('Pip', { ...tale, keeper: true })).toBe(`${plain} You were there too!`);
    expect(festivalOpener('Pip', { ...tale, keeper: false })).toBe(`${plain} You missed it — come next season?`);
    expect(keeperTaleLine(false, traits({ agreeableness: 0.2 }))).toBe("You weren't there.");
    expect(keeperTaleLine(true, traits({ agreeableness: 0.2 }))).toBe('You were there. I saw.');
    expect(keeperTaleLine(false, traits({ sociability: 0.2 }))).toBe("You weren't there.");
  });
});
