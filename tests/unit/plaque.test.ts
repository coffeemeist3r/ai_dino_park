import { describe, it, expect } from 'vitest';
import { generationOf, maxGeneration, plaqueLines, zoneTallyLine, type Lineaged } from '../../game/src/ui/plaque';
import { zonePopulations, BOWL_ID, GROVE_ID } from '../../game/src/world/zones';

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

  it('omits the stores line when no stockpile is banked (BACKLOG-285 — backward compatible)', () => {
    expect(plaqueLines({ population: 6, day: 3, generations: 2 })).toHaveLength(2);
    expect(plaqueLines({ population: 6, day: 3, generations: 2, stockpile: '' })).toHaveLength(2);
  });

  it('appends a third stores line once something is banked (BACKLOG-285)', () => {
    const lines = plaqueLines({ population: 6, day: 3, generations: 2, stockpile: '🪵 3 · 🪨 1' });
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe('Stores · 🪵 3 · 🪨 1');
  });

  it('appends a zones line when a tally is set, omits it when absent (BACKLOG-316)', () => {
    expect(plaqueLines({ population: 6, day: 3, generations: 2 })).toHaveLength(2);
    const lines = plaqueLines({ population: 6, day: 3, generations: 2, zoneTally: '▸Pocket Cretaceous 4 · The Grove 2' });
    expect(lines[lines.length - 1]).toBe('Zones · ▸Pocket Cretaceous 4 · The Grove 2');
  });
});

describe('zone indicator (BACKLOG-316)', () => {
  it('zonePopulations counts each name by home zone, every ZONES id present', () => {
    const map = { Rex: GROVE_ID, Mossback: BOWL_ID };
    const pops = zonePopulations(map, ['Rex', 'Mossback', 'Sunny'], BOWL_ID); // Sunny unmapped → fallback bowl
    expect(pops[BOWL_ID]).toBe(2);
    expect(pops[GROVE_ID]).toBe(1);
  });

  it('zonePopulations seeds an empty zone to 0', () => {
    const pops = zonePopulations({}, ['Rex', 'Mossback'], BOWL_ID);
    expect(pops[BOWL_ID]).toBe(2);
    expect(pops[GROVE_ID]).toBe(0);
  });

  it('zoneTallyLine marks only the active zone with ▸', () => {
    const line = zoneTallyLine({ [BOWL_ID]: 4, [GROVE_ID]: 2 }, GROVE_ID);
    expect(line).toBe('Pocket Cretaceous 4 · ▸The Grove 2');
    expect(zoneTallyLine({ [BOWL_ID]: 4, [GROVE_ID]: 2 }, BOWL_ID)).toBe('▸Pocket Cretaceous 4 · The Grove 2');
  });
});
