import { describe, it, expect } from 'vitest';
import { plaqueLines, plaqueLineKind, type PlaqueStats } from '../../game/src/ui/plaque';

// BACKLOG-558 — the brass in pieces. `plaqueLines` is unchanged; this is the rule that says which of
// its lines are about the park and which are about whoever is standing there.

/** Every optional line filled, so the brass is at its full eight. */
const FULL: PlaqueStats = {
  population: 8,
  day: 3,
  generations: 2,
  zone: 'The Grove',
  stockpile: '🪵 3 · 🪨 1',
  satchel: '🍖 2',
  zoneTally: '▸The Grove 2 · Pocket Cretaceous 4',
  upkeep: '1 a day',
  watch: 'AETHER-1 "Aki" · since day 1',
  sitting: '4 min',
  streak: '2 days running',
};

describe('S1 — plaqueLines is untouched', () => {
  it('a bare stats object still renders exactly the two mandatory lines', () => {
    expect(plaqueLines({ population: 1, day: 1, generations: 1 })).toEqual([
      'VIVARIUM · Pocket Cretaceous',
      'Day 1 · 1 specimen · 1 generation',
    ]);
  });

  it('the full brass is nine lines', () => {
    expect(plaqueLines(FULL)).toHaveLength(9);
  });
});

describe('S2 — which lines are about you', () => {
  it('splits the full brass six park lines to three keeper lines', () => {
    const kinds = plaqueLines(FULL).map(plaqueLineKind);
    expect(kinds.filter((k) => k === 'keeper')).toHaveLength(3);
    expect(kinds.filter((k) => k === 'stat')).toHaveLength(6);
  });

  it('names the three, by reading them off plaqueLines rather than off a literal', () => {
    const keeper = plaqueLines(FULL).filter((l) => plaqueLineKind(l) === 'keeper');
    expect(keeper).toEqual([
      'Watch · AETHER-1 "Aki" · since day 1',
      'Sitting · 4 min',
      'Keeper · 2 days running',
    ]);
  });

  it('the two mandatory lines are park lines — the vivarium is not about the player', () => {
    for (const line of plaqueLines({ population: 1, day: 1, generations: 1 })) {
      expect(plaqueLineKind(line)).toBe('stat');
    }
  });

  it('a stores line that happens to mention a keeper-ish word is still a park line', () => {
    expect(plaqueLineKind('Stores · Keeper 3')).toBe('stat');
    expect(plaqueLineKind('')).toBe('stat');
  });
});
