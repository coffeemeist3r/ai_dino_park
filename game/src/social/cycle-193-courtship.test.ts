import { describe, expect, it } from 'vitest';
import { COURT_BOND, courtGift, courtTicker, courtship, isPairs, mateBeat, mateBookLine, pairUp, type CourtContext } from './courtship';
import { foundingBonds } from '../world/founding';
import { ROSTER } from '../entities/roster';
import { SAVE_VERSION, deserialize } from '../world/saveGame';
import { pairKey } from './meetings';

const names = ROSTER.map((r) => r.name);
const persona = (name: string) => ROSTER.find((r) => r.name === name)!.personality;
const ctx = (over: Partial<CourtContext> = {}): CourtContext => ({
  bonds: foundingBonds(),
  names,
  bravery: { Mossback: 0.3, Glade: 0.6, Ember: 0.8, Sunny: 0.2 },
  young: new Set(),
  pairs: {},
  ...over,
});

describe('the first courtship (BACKLOG-618)', () => {
  it('the founding Mossback and Glade are each other’s closest friend: the bolder courts, the other says yes', () => {
    expect(courtship('Mossback', 'Glade', ctx())).toEqual({ courter: 'Glade', courted: 'Mossback', accept: true });
    expect(courtship('Glade', 'Mossback', ctx())).toEqual({ courter: 'Glade', courted: 'Mossback', accept: true });
  });

  it('a one-sided courtship is turned down: Ember loves Sunny, Sunny loves Rex', () => {
    const bonds = { ...foundingBonds(), [pairKey('Ember', 'Sunny')]: 25 };
    expect(courtship('Sunny', 'Ember', ctx({ bonds }))).toEqual({ courter: 'Ember', courted: 'Sunny', accept: false });
  });

  it('nothing under the bar, nothing for a youngster, nothing for a dino already paired', () => {
    const under = { ...foundingBonds(), [pairKey('Mossback', 'Glade')]: COURT_BOND - 1 };
    expect(courtship('Mossback', 'Glade', ctx({ bonds: under }))).toBeNull();
    expect(courtship('Bramble', 'Pip', ctx({ young: new Set(['Pip']) }))).toBeNull();
    expect(courtship('Bramble', 'Pip', ctx())).not.toBeNull();
    expect(courtship('Mossback', 'Glade', ctx({ pairs: pairUp({}, 'Glade', 'Murk', 1) }))).toBeNull();
  });

  it('the gift comes out of the courter’s persona', () => {
    expect(courtGift(persona('Mossback'))).toBe('a fern');
    expect(courtGift(persona('Rex'))).toBe('a pretty stone');
    expect(courtGift(persona('Glade'))).toBe('a song');
    expect(courtGift(persona('Ember'))).toBe('a warm spot in the sun');
    expect(courtGift(persona('Murk'))).toBe('a cool drink at the pond');
    expect(courtGift(persona('Twitch'))).toBe('a long walk');
  });

  it('the ticker, the book line and the idle beat', () => {
    const c = { courter: 'Glade', courted: 'Mossback', accept: true };
    expect(courtTicker(c, 'a song')).toBe('💕 Glade courts Mossback with a song. Mossback says yes.');
    expect(courtTicker({ ...c, accept: false }, 'a song')).toBe('💔 Glade courts Mossback with a song. Mossback turns Glade down gently.');
    const pairs = pairUp({}, 'Glade', 'Mossback', 1);
    expect(mateBookLine(pairs, 'Mossback')).toBe('💕 sweet on Glade (since day 1)');
    expect(mateBookLine(pairs, 'Rex')).toBeUndefined();
    expect([0, 1, 2, 3, 4, 9].map(mateBeat)).toEqual([false, false, false, false, true, true]);
  });
});

describe('the pair is in the save (BACKLOG-620)', () => {
  const base = { version: SAVE_VERSION, time: { day: 1, hour: 8, minute: 0 }, player: { x: 10, y: 10 }, friendship: {}, memory: {} };
  it('validates, round-trips, and is absent from an older save', () => {
    const pairs = pairUp({}, 'Glade', 'Mossback', 1);
    expect(isPairs(pairs)).toBe(true);
    expect(isPairs({ Glade: { mate: 3, day: 1 } })).toBe(false);
    expect(isPairs({ Glade: { mate: 'Mossback', day: 'one' } })).toBe(false);
    expect(deserialize(JSON.stringify({ ...base, pairs }))?.pairs).toEqual(pairs);
    expect(deserialize(JSON.stringify({ ...base, pairs: { Glade: { mate: 'Mossback' } } }))).toBeNull();
    const none = deserialize(JSON.stringify(base));
    expect(none).not.toBeNull();
    expect(none!.pairs).toBeUndefined();
  });
});
