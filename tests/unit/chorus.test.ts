import { describe, it, expect } from 'vitest';
import { chorusOrder, DAWN_HOUR, CHORUS_SPREAD_MS } from '../../game/src/audio/chorus';
import { seededPersonality, type Personality } from '../../game/src/ai/personality';
import { ROSTER } from '../../game/src/entities/roster';

/** Build a dino-shaped record with a given energy (other axes irrelevant to ordering). */
const dino = (name: string, energy: number): { name: string; traits: Personality } => ({
  name,
  traits: { curiosity: 0.5, sociability: 0.5, energy, agreeableness: 0.5, bravery: 0.5 },
});

describe('chorusOrder', () => {
  it('orders the cast by descending energy — early risers first', () => {
    const order = chorusOrder([dino('Calm', 0.1), dino('Eager', 0.9), dino('Mid', 0.5)]);
    expect(order.map((e) => e.name)).toEqual(['Eager', 'Mid', 'Calm']);
  });

  it('the first entry starts at 0 and delays never decrease down the order', () => {
    const order = chorusOrder([dino('A', 0.2), dino('B', 0.8), dino('C', 0.5), dino('D', 0.0)]);
    expect(order[0].delayMs).toBe(0);
    for (let i = 1; i < order.length; i++) {
      expect(order[i].delayMs).toBeGreaterThanOrEqual(order[i - 1].delayMs);
    }
  });

  it('the lowest-energy dino is last and waits the full spread when energies differ', () => {
    const order = chorusOrder([dino('Eager', 0.9), dino('Owl', 0.1)]);
    const last = order[order.length - 1];
    expect(last.name).toBe('Owl');
    expect(last.delayMs).toBe(CHORUS_SPREAD_MS);
    expect(last.delayMs).toBeGreaterThan(0);
  });

  it('a cast of equal energies all chirp at once (every delay 0), order preserved', () => {
    const order = chorusOrder([dino('Bea', 0.5), dino('Ada', 0.5), dino('Cyd', 0.5)]);
    expect(order.every((e) => e.delayMs === 0)).toBe(true);
    expect(order.map((e) => e.name)).toEqual(['Ada', 'Bea', 'Cyd']); // alpha tie-break, stable
  });

  it('ties in energy break alphabetically by name — deterministic across runs', () => {
    const a = chorusOrder([dino('Zeb', 0.4), dino('Ann', 0.4), dino('Mel', 0.4)]);
    const b = chorusOrder([dino('Mel', 0.4), dino('Zeb', 0.4), dino('Ann', 0.4)]);
    expect(a.map((e) => e.name)).toEqual(['Ann', 'Mel', 'Zeb']);
    expect(b).toEqual(a);
  });

  it('an empty cast yields an empty chorus', () => {
    expect(chorusOrder([])).toEqual([]);
  });

  it('on the real name-seeded founders the most energetic leads and the calmest closes', () => {
    const cast = ROSTER.map((r) => ({ name: r.name, traits: seededPersonality(r.name) }));
    const order = chorusOrder(cast);
    const byEnergy = [...cast].sort((x, y) => y.traits.energy - x.traits.energy);
    expect(order[0].name).toBe(byEnergy[0].name);
    expect(order[order.length - 1].name).toBe(byEnergy[byEnergy.length - 1].name);
    expect(order[0].delayMs).toBe(0);
  });
});

describe('DAWN_HOUR', () => {
  it('is the warm visible dawn hour', () => {
    expect(DAWN_HOUR).toBe(7);
  });
});
