import { describe, it, expect } from 'vitest';
import { comforter, unconsoledLine, headingOverLine, talkedRoundLine, COMFORT_ART_KEY, COMFORT_BOND_FLOOR } from './comfort';
import { CLOSE_BOND, friendLine } from '../social/closest';
import { worldPlacedProps } from './reachability';
import { type Bonds } from '../social/bonds';
import { pairKey } from '../social/meetings';

const bonds = (pairs: Array<[string, string, number]>): Bonds => {
  const out: Bonds = {};
  for (const [a, b, v] of pairs) out[pairKey(a, b)] = v;
  return out;
};

describe('BACKLOG-136 comfort is for friends', () => {
  it('the book\'s close bar decides who comes: 24 is refused, 25 comes', () => {
    const names = ['Glade', 'Mossback'];
    expect(comforter('Glade', bonds([['Glade', 'Mossback', 24]]), names, {}, CLOSE_BOND)).toBeNull();
    expect(comforter('Glade', bonds([['Glade', 'Mossback', 25]]), names, {}, CLOSE_BOND)).toBe('Mossback');
  });

  it('with no floor argument the old loner floor still applies', () => {
    const names = ['Glade', 'Mossback'];
    expect(COMFORT_BOND_FLOOR).toBe(8);
    expect(comforter('Glade', bonds([['Glade', 'Mossback', 8]]), names)).toBe('Mossback');
    expect(comforter('Glade', bonds([['Glade', 'Mossback', 7]]), names)).toBeNull();
  });

  it('a grateful debtor still comes under the bar', () => {
    const names = ['Glade', 'Pip'];
    expect(comforter('Glade', bonds([['Glade', 'Pip', 3]]), names, { Pip: ['Glade'] }, CLOSE_BOND)).toBe('Pip');
  });

  it('friendLine is unchanged at the close boundary', () => {
    expect(CLOSE_BOND).toBe(25);
    expect(friendLine('Rex', 24)).toBe('🤝 friendly with Rex');
    expect(friendLine('Rex', 25)).toBe('🤝 close to Rex');
    expect(friendLine('Rex', 59)).toBe('🤝 close to Rex');
    expect(friendLine('Rex', 60)).toBe('🤝 thick as thieves with Rex');
  });

  it('the ticker names who did not come, or that nobody knows it', () => {
    expect(unconsoledLine('Glade', 'Mossback')).toBe("🫥 nobody came for Glade — Mossback isn't close enough");
    expect(unconsoledLine('Twitch', null)).toBe('🫥 nobody came for Twitch — nobody here knows it');
    expect(headingOverLine('Rex', 'Glade')).toContain('Rex is heading over to Glade');
    expect(talkedRoundLine('Rex', 'Glade')).toContain('Rex talked Glade round');
  });

  it('the comfort mark is in the reachability register', () => {
    expect(worldPlacedProps().has(COMFORT_ART_KEY)).toBe(true);
  });
});
