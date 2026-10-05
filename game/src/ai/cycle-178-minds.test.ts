import { describe, it, expect } from 'vitest';
import { reflectDay, foundingReflection, planAfter, reflectionLine, duskLine, parseReflection } from './reflection';
import { chooseCompanion, seekLine, arrivalText } from './companion';
import { seededPersonality } from './personality';
import { proceduralPlan } from './plan';
import { foundingBonds, foundingGrudges } from '../world/founding';
import { pairKey } from '../social/meetings';
import { deserialize, serialize, type SaveData } from '../world/saveGame';

const BOWL = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];
const ALL = [...BOWL, 'Bramble', 'Pip', 'Thornback', 'Murk', 'Ember'];

describe('BACKLOG-583 the dusk reflection', () => {
  it('names the dino met most since the dawn snapshot, and counts the day', () => {
    const dawn = { [pairKey('Rex', 'Sunny')]: 5 };
    const now = { [pairKey('Rex', 'Sunny')]: 6, [pairKey('Rex', 'Glade')]: 3 };
    expect(reflectDay('Rex', 2, now, dawn, BOWL, {})).toEqual({ day: 2, best: 'Glade', met: 4 });
  });

  it('a day with no new meetings is a day alone', () => {
    const m = { [pairKey('Rex', 'Sunny')]: 5 };
    expect(reflectDay('Rex', 2, m, m, BOWL, {})).toEqual({ day: 2, best: null, met: 0 });
  });

  it('ties go to the warmer bond', () => {
    const now = { [pairKey('Rex', 'Glade')]: 2, [pairKey('Rex', 'Sunny')]: 2 };
    expect(reflectDay('Rex', 1, now, {}, BOWL, { [pairKey('Rex', 'Sunny')]: 30 }).best).toBe('Sunny');
  });

  it('the founding park has a yesterday — except for a dino with nobody', () => {
    const bonds = foundingBonds();
    expect(foundingReflection('Sunny', 0, bonds, ALL)).toEqual({ day: 0, best: 'Rex', met: 1 });
    expect(foundingReflection('Twitch', 0, bonds, ALL)).toBeNull();
  });

  it('a sociable dino alone yesterday wants company today; an unsociable one, or a stale day, changes nothing', () => {
    const plan = { dawn: 'solitary', day: 'forage', dusk: 'restless', night: 'solitary' } as const;
    const social = { ...seededPersonality('x'), sociability: 0.8 };
    const loner = { ...social, sociability: 0.2 };
    const alone = { day: 4, best: null, met: 0 };
    expect(planAfter(plan, alone, social, 5).day).toBe('social');
    expect(planAfter(plan, alone, loner, 5)).toBe(plan);
    expect(planAfter(plan, alone, social, 6)).toBe(plan);
    expect(planAfter(plan, { day: 4, best: 'Rex', met: 3 }, social, 5)).toBe(plan);
  });

  it('reads in the book and the ticker', () => {
    expect(reflectionLine({ day: 1, best: 'Rex', met: 2 })).toBe('spent it with Rex');
    expect(reflectionLine({ day: 1, best: null, met: 0 })).toBe('kept to itself');
    const line = duskLine(
      { Rex: { day: 1, best: 'Sunny', met: 2 }, Sunny: { day: 1, best: 'Rex', met: 2 }, Twitch: { day: 1, best: null, met: 0 } },
      ['Rex', 'Sunny', 'Twitch'],
    );
    expect(line).toBe('💭 Dusk — the park thinks back on its day: Rex & Sunny; Twitch alone.');
  });

  it('round-trips through the save, rejects a malformed entry, and an old save still loads', () => {
    const base: SaveData = {
      version: 1,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 0, y: 0 },
      friendship: {},
      memory: {},
      bonds: {},
      gratitude: {},
      lastTone: {},
    } as unknown as SaveData;
    const withR = deserialize(serialize({ ...base, reflections: { Rex: { day: 1, best: 'Sunny', met: 2 } } }));
    expect(withR?.reflections).toEqual({ Rex: { day: 1, best: 'Sunny', met: 2 } });
    const old = deserialize(serialize(base));
    expect(old).not.toBeNull();
    expect(old?.reflections).toBeUndefined();
    expect(parseReflection({ day: 1, best: 3, met: 0 })).toBeNull();
    const bad = JSON.parse(serialize(base));
    bad.reflections = { Rex: { day: 'x' } };
    expect(deserialize(JSON.stringify(bad))).toBeNull();
  });
});

describe('BACKLOG-582 whom a mind goes looking for', () => {
  const ctx = (yesterday?: string) => ({ bonds: foundingBonds(), grudges: foundingGrudges(), meetings: {}, yesterday });
  const pick = (name: string, y?: string) => chooseCompanion(name, seededPersonality(name), BOWL, ctx(y));

  it('the founding bowl: three dinos, three different reasons', () => {
    expect(pick('Mossback')).toEqual({ name: 'Twitch', why: 'rival' });
    expect(pick('Rex')?.why).toBe('stranger');
    expect(pick('Sunny', 'Rex')).toEqual({ name: 'Rex', why: 'yesterday' });
    const whys = new Set(BOWL.map((n) => pick(n, foundingReflection(n, 0, foundingBonds(), ALL)?.best ?? undefined)?.why));
    expect(whys.size).toBeGreaterThanOrEqual(3);
  });

  it('a curious dino seeks the one it has met least', () => {
    const meetings = { [pairKey('Rex', 'Glade')]: 9, [pairKey('Rex', 'Twitch')]: 1, [pairKey('Rex', 'Mossback')]: 4, [pairKey('Rex', 'Sunny')]: 7 };
    expect(chooseCompanion('Rex', seededPersonality('Rex'), BOWL, { ...ctx(), meetings })).toEqual({ name: 'Twitch', why: 'stranger' });
  });

  it('only zone-mates; nobody on the ground is nobody to seek', () => {
    expect(chooseCompanion('Sunny', seededPersonality('Sunny'), ['Sunny', 'Twitch'], ctx('Rex'))?.name).not.toBe('Rex');
    expect(chooseCompanion('Ember', seededPersonality('Ember'), ['Ember'], ctx())).toBeNull();
  });

  it('a warm dino with no yesterday goes to its warmest bond; with no bond at all, no one', () => {
    expect(chooseCompanion('Sunny', seededPersonality('Sunny'), BOWL, ctx())).toEqual({ name: 'Rex', why: 'friend' });
    expect(chooseCompanion('Twitch', seededPersonality('Twitch'), BOWL, { ...ctx(), bonds: {} })).toBeNull();
  });

  it('says why as it sets off, and something in kind when it gets there', () => {
    expect(seekLine('Mossback', { name: 'Twitch', why: 'rival' })).toBe('👀 Mossback goes looking for Twitch — spoiling for it.');
    expect(arrivalText({ name: 'Twitch', why: 'rival' })).toBe('You again, Twitch.');
    expect(arrivalText({ name: 'Rex', why: 'yesterday' })).toBe('Rex! Same again today?');
  });

  it('plans stay deterministic', () => {
    expect(proceduralPlan('Rex', 3, seededPersonality('Rex'))).toEqual(proceduralPlan('Rex', 3, seededPersonality('Rex')));
  });
});
