import { describe, expect, it } from 'vitest';
import { berthOf, isPairs, jiltTicker, jilted, pairUp } from './courtship';
import { shouldLay } from './breeding';
import { foundingBonds } from '../world/founding';
import { ROSTER } from '../entities/roster';
import { seededPersonality } from '../ai/personality';
import { pairKey } from './meetings';

const names = ROSTER.map((r) => r.name);
const agreeableness = Object.fromEntries(names.map((n) => [n, seededPersonality(n).agreeableness]));
const ctx = (over = {}) => ({ bonds: foundingBonds(), names, agreeableness, pairs: {}, ...over });

describe('the jilted friend (BACKLOG-621)', () => {
  it('Rex and Sunny pair: Ember loved Sunny best, and Ember is warm enough to be glad', () => {
    expect(jilted('Rex', 'Sunny', ctx())).toEqual([{ name: 'Ember', friend: 'Sunny', rival: 'Rex', mood: 'glad' }]);
  });

  it('Mossback and Glade pair: Thornback is glad, Murk is jealous of Mossback', () => {
    const j = jilted('Mossback', 'Glade', ctx());
    expect(j).toContainEqual({ name: 'Thornback', friend: 'Mossback', rival: 'Glade', mood: 'glad' });
    expect(j).toContainEqual({ name: 'Murk', friend: 'Glade', rival: 'Mossback', mood: 'jealous' });
    expect(jiltTicker(j.find((x) => x.name === 'Murk')!)).toBe('😒 Murk watches Glade pair off with Mossback, and sulks');
  });

  it('skips a dino already paired, and a friend below the floor', () => {
    const pairs = pairUp({}, 'Murk', 'Twitch', 1);
    expect(jilted('Mossback', 'Glade', ctx({ pairs })).map((j) => j.name)).not.toContain('Murk');
    const bonds = { ...foundingBonds(), [pairKey('Glade', 'Murk')]: 9 };
    expect(jilted('Mossback', 'Glade', ctx({ bonds })).map((j) => j.name)).not.toContain('Murk');
  });
});

describe('a pair keeps a nest (BACKLOG-622)', () => {
  const nest = { zone: 'bowl', tileX: 7, tileY: 4 };
  it('both mates carry the nest, and lie side by side', () => {
    const pairs = pairUp({}, 'Rex', 'Sunny', 1, nest);
    expect(pairs.Rex.nest).toEqual(nest);
    expect(pairs.Sunny.nest).toEqual(nest);
    expect(berthOf(pairs, 'Rex', 20)).toEqual({ tileX: 7, tileY: 4 });
    expect(berthOf(pairs, 'Sunny', 20)).toEqual({ tileX: 8, tileY: 4 });
    expect(berthOf(pairUp({}, 'Rex', 'Sunny', 1, { ...nest, tileX: 19 }), 'Sunny', 20)).toEqual({ tileX: 18, tileY: 4 });
    expect(berthOf(pairUp({}, 'Rex', 'Sunny', 1), 'Rex', 20)).toBeUndefined();
  });

  it('isPairs takes a nest-less pair and a good nest, and refuses a bad one', () => {
    expect(isPairs({ Rex: { mate: 'Sunny', day: 1 } })).toBe(true);
    expect(isPairs({ Rex: { mate: 'Sunny', day: 1, nest } })).toBe(true);
    expect(isPairs({ Rex: { mate: 'Sunny', day: 1, nest: { zone: 'bowl', tileX: '7', tileY: 4 } } })).toBe(false);
  });

  it('a pair lays without the bond bar; an unpaired couple still needs 60', () => {
    const o = { bond: 0, population: 10, isClearNight: true, bothHuddling: true, hasEggForPair: false };
    expect(shouldLay({ ...o, paired: true })).toBe(true);
    expect(shouldLay(o)).toBe(false);
    expect(shouldLay({ ...o, paired: true, bothHuddling: false })).toBe(false);
  });
});
