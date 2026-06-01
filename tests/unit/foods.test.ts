import { describe, it, expect } from 'vitest';
import { FOODS, favoriteFood, foodReaction } from '../../game/src/world/foods';
import { FEED_GAIN, FEED_GAIN_FAV } from '../../game/src/world/feeding';
import { seededPersonality } from '../../game/src/ai/personality';

const ROSTER = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];

describe('favoriteFood', () => {
  it('returns a real food from the table, deterministically per personality', () => {
    const t = seededPersonality('Rex');
    const a = favoriteFood(t);
    const b = favoriteFood(t);
    expect(FOODS).toContain(a);
    expect(a).toBe(b); // deterministic
  });

  it('spans at least three distinct foods across the starting cast', () => {
    const favs = new Set(ROSTER.map((n) => favoriteFood(seededPersonality(n)).id));
    expect(favs.size).toBeGreaterThanOrEqual(3);
  });
});

describe('foodReaction', () => {
  it('a dino loves its favorite — bigger gain, 😋', () => {
    const t = seededPersonality('Rex');
    const fav = favoriteFood(t);
    const r = foodReaction(fav, t);
    expect(r.favorite).toBe(true);
    expect(r.gain).toBe(FEED_GAIN_FAV);
    expect(r.emoji).toBe('😋');
  });

  it('any other food is plain feed — normal gain, 🙂', () => {
    const t = seededPersonality('Rex');
    const favId = favoriteFood(t).id;
    const other = FOODS.find((f) => f.id !== favId)!;
    const r = foodReaction(other, t);
    expect(r.favorite).toBe(false);
    expect(r.gain).toBe(FEED_GAIN);
    expect(r.emoji).toBe('🙂');
  });

  it('the favorite gain is strictly bigger than plain feed', () => {
    expect(FEED_GAIN_FAV).toBeGreaterThan(FEED_GAIN);
  });

  it('is pure-safe with no traits (treats nothing as a favorite)', () => {
    expect(foodReaction(FOODS[0], undefined).favorite).toBe(false);
    expect(foodReaction(FOODS[0], undefined).gain).toBe(FEED_GAIN);
  });
});
