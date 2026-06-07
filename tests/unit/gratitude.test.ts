import { describe, it, expect } from 'vitest';
import {
  comforter,
  recordGratitude,
  COMFORT_BOND_FLOOR,
  type Gratitude,
} from '../../game/src/world/comfort';
import { strengthen } from '../../game/src/social/bonds';
import type { Bonds } from '../../game/src/social/bonds';

const NAMES = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];

describe('recordGratitude (BACKLOG-132)', () => {
  it('files who consoled a dino under that dino', () => {
    const g = recordGratitude({}, 'Sunny', 'Twitch');
    expect(g.Sunny).toEqual(['Twitch']);
  });

  it('dedupes a repeated (consoled, byWhom) pair', () => {
    let g = recordGratitude({}, 'Sunny', 'Twitch');
    g = recordGratitude(g, 'Sunny', 'Twitch');
    expect(g.Sunny).toEqual(['Twitch']);
  });

  it('appends a second distinct comforter', () => {
    let g = recordGratitude({}, 'Sunny', 'Twitch');
    g = recordGratitude(g, 'Sunny', 'Rex');
    expect(g.Sunny).toEqual(['Twitch', 'Rex']);
  });

  it('does not mutate its input', () => {
    const before: Gratitude = { Sunny: ['Twitch'] };
    const after = recordGratitude(before, 'Sunny', 'Rex');
    expect(before).toEqual({ Sunny: ['Twitch'] });
    expect(after).not.toBe(before);
  });
});

describe('comforter — gratitude echo (BACKLOG-132)', () => {
  it('with no ledger, behaves exactly as the cycle-33 closest-friend rule', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Sunny', 'Twitch', 20);
    bonds = strengthen(bonds, 'Sunny', 'Rex', 10);
    expect(comforter('Sunny', bonds, NAMES)).toBe('Twitch');
    expect(comforter('Sunny', bonds, NAMES, {})).toBe('Twitch');
  });

  it('with no ledger and nobody above the floor, returns null', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Sunny', 'Twitch', COMFORT_BOND_FLOOR - 1);
    expect(comforter('Sunny', bonds, NAMES, {})).toBeNull();
  });

  it('a grateful debtor comes even past a stronger-bond peer', () => {
    // Glade has the strongest bond with the sulker Twitch, but Sunny owes Twitch.
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Twitch', 'Glade', 30);
    bonds = strengthen(bonds, 'Twitch', 'Sunny', 16);
    const gratitude: Gratitude = { Sunny: ['Twitch'] }; // Sunny was consoled by Twitch
    expect(comforter('Twitch', bonds, NAMES)).toBe('Glade'); // no ledger → bond wins
    expect(comforter('Twitch', bonds, NAMES, gratitude)).toBe('Sunny'); // ledger → debtor wins
  });

  it('the gratitude override ignores the floor', () => {
    // Sunny owes Twitch but their bond is below the floor; the debtor still comes.
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Twitch', 'Sunny', COMFORT_BOND_FLOOR - 3);
    const gratitude: Gratitude = { Sunny: ['Twitch'] };
    expect(comforter('Twitch', bonds, NAMES)).toBeNull(); // below floor, no ledger
    expect(comforter('Twitch', bonds, NAMES, gratitude)).toBe('Sunny');
  });

  it('among multiple debtors, the highest-bond one wins', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Twitch', 'Sunny', 5);
    bonds = strengthen(bonds, 'Twitch', 'Rex', 25);
    const gratitude: Gratitude = { Sunny: ['Twitch'], Rex: ['Twitch'] };
    expect(comforter('Twitch', bonds, NAMES, gratitude)).toBe('Rex');
  });

  it('debtor bond ties break to the lexicographically-smallest name', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Twitch', 'Sunny', 12);
    bonds = strengthen(bonds, 'Twitch', 'Glade', 12);
    const gratitude: Gratitude = { Sunny: ['Twitch'], Glade: ['Twitch'] };
    expect(comforter('Twitch', bonds, NAMES, gratitude)).toBe('Glade'); // Glade < Sunny
  });

  it('a debtor not in `names` is ignored, falling back to the normal rule', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Twitch', 'Glade', 20); // present, above floor
    const gratitude: Gratitude = { Pteri: ['Twitch'] }; // Pteri isn't on the map
    expect(comforter('Twitch', bonds, NAMES, gratitude)).toBe('Glade');
  });

  it('an absent debtor with nobody above the floor still returns null', () => {
    let bonds: Bonds = {};
    bonds = strengthen(bonds, 'Twitch', 'Glade', COMFORT_BOND_FLOOR - 1);
    const gratitude: Gratitude = { Pteri: ['Twitch'] };
    expect(comforter('Twitch', bonds, NAMES, gratitude)).toBeNull();
  });
});
