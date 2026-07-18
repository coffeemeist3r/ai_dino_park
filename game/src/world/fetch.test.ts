import { describe, it, expect } from 'vitest';
import {
  FETCH_BOND_FLOOR,
  FETCH_GLYPH,
  fetchEventLine,
  fetchLine,
  fetchedMemory,
  fetcher,
  fetcherMemory,
  missingTheMeal,
} from './fetch';
import { LONER_FLOOR } from './loner';
import { strengthen, type Bonds } from '../social/bonds';

const bond = (pairs: Array<[string, string, number]>): Bonds => {
  let b: Bonds = {};
  for (const [a, c, n] of pairs) b = strengthen(b, a, c, n);
  return b;
};

describe('the fetch floor (BACKLOG-381)', () => {
  /**
   * The pin. `isLoner` requires EVERY bond < LONER_FLOOR; if the fetch floor were >= LONER_FLOOR the
   * fetcher pick would be null by construction and the whole beat would be dead code for every dino.
   * (This is the bug the cycle-105 codeplan caught in its own design — keep it caught.)
   */
  it('sits strictly below the loner floor, or nobody could ever come', () => {
    expect(FETCH_BOND_FLOOR).toBeLessThan(LONER_FLOOR);
  });

  it('a peer inside [FETCH_BOND_FLOOR, LONER_FLOOR) is a reachable fetcher', () => {
    const bonds = bond([['Mossback', 'Rex', FETCH_BOND_FLOOR + 1]]);
    // Rex is close enough to come, and still not close enough to lift Mossback out of loner status.
    expect(FETCH_BOND_FLOOR + 1).toBeLessThan(LONER_FLOOR);
    expect(fetcher('Mossback', bonds, ['Rex', 'Sunny'])).toBe('Rex');
  });
});

describe('who is missing the meal (BACKLOG-381)', () => {
  it('is the withdrawn dino that did not rush — and only that dino', () => {
    expect(missingTheMeal(true, false)).toBe(true);
    expect(missingTheMeal(true, true)).toBe(false); // a loner already coming needs no fetching
    expect(missingTheMeal(false, false)).toBe(false); // merely full or lazy, but it has friends
    expect(missingTheMeal(false, true)).toBe(false);
  });
});

describe('who comes for it (BACKLOG-381)', () => {
  it('picks the highest-bond peer, not the first listed', () => {
    const bonds = bond([
      ['Mossback', 'Rex', 5],
      ['Mossback', 'Sunny', 7],
    ]);
    expect(fetcher('Mossback', bonds, ['Rex', 'Sunny'])).toBe('Sunny');
  });

  it('breaks ties lexicographically (the topBy convention)', () => {
    const bonds = bond([
      ['Mossback', 'Sunny', 6],
      ['Mossback', 'Glade', 6],
    ]);
    expect(fetcher('Mossback', bonds, ['Sunny', 'Glade'])).toBe('Glade');
  });

  it('returns null when every peer is below the floor — nobody comes', () => {
    const bonds = bond([
      ['Mossback', 'Rex', FETCH_BOND_FLOOR - 1],
      ['Mossback', 'Sunny', 1],
    ]);
    expect(fetcher('Mossback', bonds, ['Rex', 'Sunny'])).toBeNull();
  });

  it('returns null with no peers at all', () => {
    expect(fetcher('Mossback', {}, [])).toBeNull();
  });

  it('never picks the loner itself', () => {
    const bonds = bond([['Mossback', 'Rex', 6]]);
    expect(fetcher('Mossback', bonds, ['Mossback', 'Rex'])).toBe('Rex');
  });
});

describe('what the beat says and leaves behind (BACKLOG-381)', () => {
  it('the bubble names both dinos and wears the glyph', () => {
    const line = fetchLine('Rex', 'Mossback');
    expect(line).toContain('Rex');
    expect(line).toContain('Mossback');
    expect(line).toContain(FETCH_GLYPH);
  });

  it('each side keeps its own half of the memory', () => {
    expect(fetchedMemory('Rex')).toContain('Rex');
    expect(fetcherMemory('Mossback')).toContain('Mossback');
    expect(fetchedMemory('Rex')).not.toEqual(fetcherMemory('Rex'));
  });

  it('the ticker line names the fetcher and the fetched', () => {
    const line = fetchEventLine('Rex', 'Mossback');
    expect(line).toContain('Rex');
    expect(line).toContain('Mossback');
  });
});
