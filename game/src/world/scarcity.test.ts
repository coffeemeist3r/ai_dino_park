import { describe, it, expect } from 'vitest';
import { zoneAppeal, richestNeighbor, poorestResidents, FOOD_APPEAL_WEIGHT } from './scarcity';

describe('zoneAppeal (BACKLOG-450)', () => {
  it('folds prosperity + weighted food', () => {
    expect(zoneAppeal(5, 3)).toBe(5 + 3 * FOOD_APPEAL_WEIGHT);
    expect(zoneAppeal(0, 0)).toBe(0);
  });

  it('is monotonic — raising either signal never lowers appeal', () => {
    const base = zoneAppeal(4, 2);
    expect(zoneAppeal(5, 2)).toBeGreaterThanOrEqual(base);
    expect(zoneAppeal(4, 3)).toBeGreaterThanOrEqual(base);
  });
});

describe('richestNeighbor (BACKLOG-450)', () => {
  const appeal = (z: string) => ({ bowl: 3, grove: 7, fernreach: 5 }[z] ?? 0);

  it('picks the highest-appeal neighbour', () => {
    expect(richestNeighbor(['bowl', 'fernreach'], appeal)).toBe('fernreach');
    expect(richestNeighbor(['bowl', 'grove', 'fernreach'], appeal)).toBe('grove');
  });

  it('breaks a tie by input order (deterministic, no coin flip)', () => {
    const flat = () => 4;
    expect(richestNeighbor(['bowl', 'grove'], flat)).toBe('bowl');
    expect(richestNeighbor(['grove', 'bowl'], flat)).toBe('grove');
  });

  it('returns null for an empty neighbour list', () => {
    expect(richestNeighbor([], appeal)).toBeNull();
  });
});

describe('poorestResidents (BACKLOG-450)', () => {
  type Dino = { name: string; zone: string };
  const zoneOf = (d: Dino) => d.zone;
  const appeal = (z: string) => ({ rich: 9, poor: 1, mid: 5 }[z] ?? 0);

  it('returns exactly the residents of the least-appealing occupied zone', () => {
    const dinos: Dino[] = [
      { name: 'A', zone: 'rich' },
      { name: 'B', zone: 'poor' },
      { name: 'C', zone: 'poor' },
      { name: 'D', zone: 'mid' },
    ];
    expect(poorestResidents(dinos, zoneOf, appeal).map((d) => d.name)).toEqual(['B', 'C']);
  });

  it('returns all candidates when every zone ties', () => {
    const dinos: Dino[] = [
      { name: 'A', zone: 'poor' },
      { name: 'B', zone: 'poor' },
    ];
    expect(poorestResidents(dinos, zoneOf, appeal)).toHaveLength(2);
  });

  it('passes through a 0- or 1-candidate list unchanged', () => {
    expect(poorestResidents([], zoneOf, appeal)).toEqual([]);
    const one: Dino[] = [{ name: 'A', zone: 'rich' }];
    expect(poorestResidents(one, zoneOf, appeal)).toBe(one);
  });
});
