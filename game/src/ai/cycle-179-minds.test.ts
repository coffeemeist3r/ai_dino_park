import { describe, it, expect } from 'vitest';
import { dayVoice, daySummary, reflectionLine, parseReflection, type Reflection } from './reflection';
import { planPlace, errandLine, headingLine } from './place';
import { type Personality } from './personality';

const t = (o: Partial<Personality>): Personality => ({ curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5, ...o });
const withRex: Reflection = { day: 1, best: 'Rex', met: 3 };
const alone: Reflection = { day: 1, best: null, met: 0 };

describe('BACKLOG-585 the day in its own voice', () => {
  it('different days, different people, different lines', () => {
    const lines = [
      dayVoice('A', t({ agreeableness: 0.9 }), withRex, false),
      dayVoice('A', t({ agreeableness: 0.1 }), withRex, true),
      dayVoice('A', t({ sociability: 0.9 }), alone, false),
      dayVoice('A', t({ sociability: 0.1 }), alone, false),
    ];
    expect(new Set(lines).size).toBe(4);
    expect(lines[0]).toContain('Rex');
    expect(lines[2]).toMatch(/tomorrow/i);
  });

  it('two dinos with the same day can sound different', () => {
    const names = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade', 'Bramble', 'Pip'];
    const said = new Set(names.map((n) => dayVoice(n, t({ agreeableness: 0.9 }), withRex, false)));
    expect(said.size).toBe(2);
  });

  it('a day with a destination leads with it', () => {
    expect(dayVoice('Rex', t({}), { ...alone, went: 'The Grove' }, false)).toMatch(/^Went all the way to The Grove\. /);
    expect(daySummary({ ...withRex, went: 'The Grove' }, true)).toBe(
      'You spent most of today with Rex, a dino you have a grudge against. You went to The Grove.',
    );
  });

  it('the book quotes it', () => {
    expect(reflectionLine({ ...withRex, said: 'Fine.' })).toBe('spent it with Rex — "Fine."');
    expect(reflectionLine(withRex)).toBe('spent it with Rex');
  });

  it('save parse keeps a spoken line and a place, drops junk, leaves absence absent', () => {
    expect(parseReflection({ day: 2, best: null, met: 0, said: 'Quiet.', went: 'The Grove' })).toEqual({ day: 2, best: null, met: 0, said: 'Quiet.', went: 'The Grove' });
    expect(parseReflection({ day: 2, best: null, met: 0, said: 7 })).toEqual({ day: 2, best: null, met: 0 });
    expect(parseReflection({ day: 2, best: 'Rex', met: 1 })).toEqual({ day: 2, best: 'Rex', met: 1 });
  });
});

describe('BACKLOG-586 places in the plan', () => {
  const appeal = (scores: Record<string, number>) => (z: string) => scores[z] ?? 0;

  it('a restless phase names a neighbour, the same one every time', () => {
    const a = planPlace('Glade', 1, 'day', 'restless', 'bowl', ['grove'], appeal({}));
    expect(a).toBe('grove');
    const b = planPlace('Bramble', 1, 'day', 'restless', 'grove', ['bowl', 'fernreach', 'ridge'], appeal({}));
    expect(['bowl', 'fernreach', 'ridge']).toContain(b);
    expect(planPlace('Bramble', 1, 'day', 'restless', 'grove', ['ridge', 'bowl', 'fernreach'], appeal({}))).toBe(b);
  });

  it('a forage phase goes where the food is, or stays home when home is richest', () => {
    expect(planPlace('Sunny', 1, 'day', 'forage', 'bowl', ['grove'], appeal({ bowl: 1, grove: 3 }))).toBe('grove');
    expect(planPlace('Sunny', 1, 'day', 'forage', 'bowl', ['grove'], appeal({ bowl: 3, grove: 1 }))).toBeNull();
  });

  it('social and solitary leans stay put; no neighbours, nowhere to go', () => {
    expect(planPlace('Rex', 1, 'day', 'social', 'bowl', ['grove'], appeal({ grove: 9 }))).toBeNull();
    expect(planPlace('Rex', 1, 'day', 'solitary', 'bowl', ['grove'], appeal({ grove: 9 }))).toBeNull();
    expect(planPlace('Rex', 1, 'day', 'restless', 'saltpan', [], appeal({}))).toBeNull();
  });

  it('says why it is going', () => {
    expect(errandLine('Glade', 'The Grove', 'restless')).toBe('🧭 Glade sets off for The Grove — itchy feet.');
    expect(errandLine('Sunny', 'The Grove', 'forage')).toBe('🧭 Sunny sets off for The Grove — after the food there.');
    expect(headingLine('The Grove', 'restless')).toBe('The Grove (itchy feet)');
  });
});
