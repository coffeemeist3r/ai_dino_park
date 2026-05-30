import { describe, it, expect } from 'vitest';
import { generationOf, maxGeneration, plaqueLines, type Lineaged } from '../../game/src/ui/plaque';

describe('generations', () => {
  it('founders (no parents) are generation 1', () => {
    expect(maxGeneration([])).toBe(1);
    const byName = new Map<string, Lineaged>([['Rex', { name: 'Rex' }]]);
    expect(generationOf('Rex', byName)).toBe(1);
  });

  it('a child of two founders is generation 2', () => {
    const born: Lineaged[] = [{ name: 'Rexback', parents: ['Rex', 'Mossback'] }];
    expect(maxGeneration(born)).toBe(2);
  });

  it('a grandchild is generation 3', () => {
    const born: Lineaged[] = [
      { name: 'Rexback', parents: ['Rex', 'Mossback'] }, // gen 2
      { name: 'Rexbacky', parents: ['Rexback', 'Sunny'] }, // gen 3 (parent Rexback is gen 2)
    ];
    expect(maxGeneration(born)).toBe(3);
  });

  it('does not loop on a malformed self-parent', () => {
    const born: Lineaged[] = [{ name: 'Oops', parents: ['Oops', 'Rex'] }];
    expect(() => maxGeneration(born)).not.toThrow();
    expect(maxGeneration(born)).toBeGreaterThanOrEqual(1);
  });
});

describe('plaqueLines', () => {
  it('renders title + stats with correct pluralization', () => {
    expect(plaqueLines({ population: 6, day: 3, generations: 2 })).toEqual([
      'VIVARIUM · Pocket Cretaceous',
      'Day 3 · 6 specimens · 2 generations',
    ]);
    expect(plaqueLines({ population: 1, day: 1, generations: 1 })[1]).toBe('Day 1 · 1 specimen · 1 generation');
  });
});
