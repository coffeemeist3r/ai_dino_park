import { describe, it, expect } from 'vitest';
import { GIFTS, giftReaction, giftScore } from '../../game/src/social/gifts';
import type { Personality } from '../../game/src/ai/personality';

const mid: Personality = {
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness: 0.5,
  bravery: 0.5,
};
const gift = (id: string) => GIFTS.find((g) => g.id === id)!;

describe('GIFTS', () => {
  it('has at least 4 items with distinct ids', () => {
    expect(GIFTS.length).toBeGreaterThanOrEqual(4);
    expect(new Set(GIFTS.map((g) => g.id)).size).toBe(GIFTS.length);
  });
});

describe('giftReaction', () => {
  it('a curious dino loves the shiny shell', () => {
    const r = giftReaction(gift('shell'), { ...mid, curiosity: 0.95 });
    expect(r.verdict).toBe('loved');
    expect(r.delta).toBeGreaterThan(0);
  });

  it('a calm dino loves the smooth rock; an energetic dino dislikes it', () => {
    expect(giftReaction(gift('rock'), { ...mid, energy: 0.05 }).verdict).toBe('loved');
    const energetic = giftReaction(gift('rock'), { ...mid, energy: 0.95 });
    expect(energetic.verdict).toBe('disliked');
    expect(energetic.delta).toBeLessThan(0);
  });

  it('a curious dino does not love a snack (cross-pairing)', () => {
    expect(giftReaction(gift('snack'), { ...mid, curiosity: 0.95 }).verdict).not.toBe('loved');
  });

  it('no traits → a defined verdict and numeric delta, no throw', () => {
    const r = giftReaction(gift('shell'), undefined);
    expect(['loved', 'liked', 'neutral', 'disliked']).toContain(r.verdict);
    expect(typeof r.delta).toBe('number');
  });

  it('verdict and delta signs are coherent across all gifts', () => {
    for (const g of GIFTS) {
      for (const t of [0, 0.5, 1]) {
        const traits: Personality = { curiosity: t, sociability: t, energy: t, agreeableness: t, bravery: t };
        const { verdict, delta } = giftReaction(g, traits);
        if (verdict === 'loved' || verdict === 'liked') expect(delta).toBeGreaterThan(0);
        if (verdict === 'neutral') expect(delta).toBeGreaterThanOrEqual(0);
        if (verdict === 'disliked') expect(delta).toBeLessThan(0);
      }
    }
  });

  it('giftScore is 0 without traits', () => {
    expect(giftScore(gift('shell'), undefined)).toBe(0);
  });
});
