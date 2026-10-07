import { describe, it, expect } from 'vitest';
import { answerArrival, welcomeText, welcomeLine } from './welcome';
import { foldChoice, shouldFollow, arrivalText, seekLine } from './companion';
import { foldPlace, followLine } from './place';
import { parseChoice } from './webllmBrain';
import { type Personality } from './personality';

const t = (o: Partial<Personality>): Personality => ({ curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5, ...o });

describe('BACKLOG-589 the ground answers a newcomer', () => {
  it('one arrival, five minds, five answers — and yesterday decides two of them', () => {
    const answers = [
      answerArrival('A', t({}), 'Sunny', { rival: true, met: 9 }),
      answerArrival('B', t({}), 'Sunny', { yesterday: { day: 1, best: 'Sunny', met: 2 }, rival: false, met: 9 }),
      answerArrival('C', t({ sociability: 0.8 }), 'Sunny', { yesterday: { day: 1, best: null, met: 0 }, rival: false, met: 9 }),
      answerArrival('D', t({ curiosity: 0.9 }), 'Sunny', { rival: false, met: 0 }),
      answerArrival('E', t({ sociability: 0.1 }), 'Sunny', { rival: false, met: 9 }),
    ];
    expect(answers).toEqual(['bristle', 'missed', 'company', 'curious', 'cold']);
    // The same dino with a different yesterday answers differently.
    expect(answerArrival('B', t({}), 'Sunny', { yesterday: { day: 1, best: 'Rex', met: 2 }, rival: false, met: 9 })).toBeNull();
    expect(answerArrival('C', t({ sociability: 0.8 }), 'Sunny', { yesterday: { day: 1, best: 'Rex', met: 2 }, rival: false, met: 9 })).toBeNull();
  });

  it('a rival outranks yesterday; no reflection is never missed or company', () => {
    expect(answerArrival('A', t({}), 'Sunny', { yesterday: { day: 1, best: 'Sunny', met: 2 }, rival: true, met: 0 })).toBe('bristle');
    expect(answerArrival('A', t({ sociability: 0.9 }), 'Sunny', { rival: false, met: 9 })).toBeNull();
    expect(answerArrival('Sunny', t({}), 'Sunny', { rival: true, met: 0 })).toBeNull();
  });

  it('the words are name-seeded and the ticker names everyone', () => {
    const names = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade', 'Bramble', 'Pip'];
    expect(new Set(names.map((n) => welcomeText('missed', n, 'Ember'))).size).toBe(2);
    expect(welcomeText('bristle', 'Rex', 'Ember')).toMatch(/^(Oh\. You\.|Not you again, Ember\.)$/);
    expect(welcomeLine('Sunny', 'Pocket Cretaceous', [{ name: 'Rex', kind: 'missed' }, { name: 'Twitch', kind: 'cold' }])).toBe(
      '🌿 Pocket Cretaceous answers Sunny: Rex glad it came, Twitch turns away.',
    );
  });
});

describe('BACKLOG-588 the model hand on whom and where', () => {
  const floor = { name: 'Rex', why: 'yesterday' as const };
  it('foldChoice takes a closed-list name, and nothing else', () => {
    expect(foldChoice('Twitch', floor, ['Rex', 'Twitch'])).toEqual({ name: 'Twitch', why: 'chosen' });
    expect(foldChoice(null, floor, ['Rex', 'Twitch'])).toBe(floor);
    expect(foldChoice('Nobody', floor, ['Rex', 'Twitch'])).toBe(floor);
    expect(foldChoice('Sunny', floor, ['Rex', 'Twitch'])).toBe(floor); // itself is not on its own list
    expect(foldChoice('Rex', floor, ['Rex', 'Twitch'])).toBe(floor);
    expect(foldChoice('Rex', null, ['Rex'])).toEqual({ name: 'Rex', why: 'chosen' });
    expect(arrivalText({ name: 'Rex', why: 'chosen' })).toBe('Rex. I came to find you.');
    expect(seekLine('Sunny', { name: 'Rex', why: 'chosen' })).toBe('👀 Sunny goes looking for Rex — its mind made up.');
  });

  it('foldPlace takes only a neighbour', () => {
    expect(foldPlace('grove', null, ['grove', 'ridge'])).toBe('grove');
    expect(foldPlace('saltpan', 'ridge', ['grove', 'ridge'])).toBe('ridge');
    expect(foldPlace(null, 'ridge', ['grove'])).toBe('ridge');
  });

  it('parseChoice reads names off free text, case-insensitively', () => {
    const o = { companions: ['Rex', 'Twitch'], grounds: ['The Grove', 'The Sunward Ridge'] };
    expect(parseChoice('twitch — the sunward ridge', o)).toEqual({ seek: 'Twitch', go: 'The Sunward Ridge' });
    expect(parseChoice('I want Rex, then maybe Twitch. Staying here.', o)).toEqual({ seek: 'Rex', go: null });
    expect(parseChoice('nobody, nowhere', o)).toBeNull();
  });

  it('shouldFollow holds the floor, a crossing companion, a shared ground, and the mutual pair', () => {
    expect(shouldFollow('Sunny', 'Rex', 'grove', 'bowl', 3, false, null, 1)).toBe(true);
    expect(shouldFollow('Sunny', 'Rex', 'grove', 'bowl', 1, false, null, 1)).toBe(false);
    expect(shouldFollow('Sunny', 'Rex', 'grove', 'bowl', 3, true, null, 1)).toBe(false);
    expect(shouldFollow('Sunny', 'Rex', 'bowl', 'bowl', 3, false, null, 1)).toBe(false);
    expect(shouldFollow('Sunny', 'Rex', 'grove', 'bowl', 3, false, 'Sunny', 1)).toBe(false); // Rex goes, Sunny waits
    expect(shouldFollow('Rex', 'Sunny', 'bowl', 'grove', 3, false, 'Rex', 1)).toBe(true);
    expect(followLine('Glade', 'Pocket Cretaceous', 'Mossback')).toBe('🧭 Glade sets off for Pocket Cretaceous — after Mossback.');
  });
});
