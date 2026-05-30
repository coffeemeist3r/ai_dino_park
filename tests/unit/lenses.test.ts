import { describe, it, expect } from 'vitest';
import { nextLens, bondedPairs, tickerLines, bookLines, LENS_ORDER } from '../../game/src/ui/lenses';

describe('nextLens', () => {
  it('cycles through every lens and wraps back to off', () => {
    let lens = LENS_ORDER[0];
    const seen = [lens];
    for (let i = 0; i < LENS_ORDER.length; i++) {
      lens = nextLens(lens);
      seen.push(lens);
    }
    expect(seen.slice(0, LENS_ORDER.length)).toEqual([...LENS_ORDER]);
    expect(seen[LENS_ORDER.length]).toBe('off'); // wrapped
  });
});

describe('bondedPairs', () => {
  it('keeps pairs at/above the threshold, strongest first', () => {
    const bonds = { 'Mossback|Rex': 72, 'Glade|Sunny': 40, 'Rex|Sunny': 10 };
    expect(bondedPairs(bonds, 40)).toEqual([
      { a: 'Mossback', b: 'Rex', points: 72 },
      { a: 'Glade', b: 'Sunny', points: 40 },
    ]);
  });

  it('returns nothing when no pair clears the bar', () => {
    expect(bondedPairs({ 'Rex|Sunny': 5 }, 60)).toEqual([]);
  });
});

describe('tickerLines', () => {
  it('returns the most recent n events', () => {
    const events = ['a', 'b', 'c', 'd'];
    expect(tickerLines(events, 2)).toEqual(['c', 'd']);
    expect(tickerLines(['only'], 8)).toEqual(['only']);
  });
});

describe('bookLines', () => {
  it('renders a block per dino including lineage and rumor count', () => {
    const lines = bookLines([
      { name: 'Rex', species: 'triceratops', hearts: 4, topBond: 72, role: 'homebody', rumorsHeard: 2 },
      {
        name: 'Rexback',
        species: 'triceratops',
        hearts: 0,
        topBond: 0,
        role: 'wanderer',
        parents: ['Rex', 'Mossback'],
        rumorsHeard: 0,
      },
    ]);
    const text = lines.join('\n');
    expect(text).toContain('Rex  (triceratops)  [homebody]');
    expect(text).toContain('bond:72');
    expect(text).toContain('knows 2 rumors');
    expect(text).toContain('child of Rex + Mossback');
  });
});
