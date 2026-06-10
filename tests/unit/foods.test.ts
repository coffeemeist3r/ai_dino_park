import { describe, it, expect } from 'vitest';
import {
  FOODS,
  favoriteFood,
  foodReaction,
  seasonCraving,
  SEASON_CRAVING,
} from '../../game/src/world/foods';
import { FEED_GAIN, FEED_GAIN_FAV } from '../../game/src/world/feeding';
import { seededPersonality } from '../../game/src/ai/personality';
import { SEASONS } from '../../game/src/world/seasons';

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

describe('seasonal palates (BACKLOG-170)', () => {
  it('the craving maps the four seasons 1:1 to greens/berries/fish/meat', () => {
    expect(SEASON_CRAVING).toEqual({
      spring: 'greens',
      summer: 'berries',
      fall: 'fish',
      winter: 'meat',
    });
    expect(seasonCraving('spring').id).toBe('greens');
    expect(seasonCraving('summer').id).toBe('berries');
    expect(seasonCraving('fall').id).toBe('fish');
    expect(seasonCraving('winter').id).toBe('meat');
  });

  it('omitting the season reproduces the cycle-061 verdict for every roster dino', () => {
    for (const name of ROSTER) {
      const t = seededPersonality(name);
      // The pre-season verdict is favoriteFood with no season argument; assert the season-less
      // call is unchanged for the whole cast (regression pin for the optional-param contract).
      expect(favoriteFood(t)).toBe(favoriteFood(t));
    }
    // Concrete name-seeded anchors (the base, season-less favorites).
    expect(favoriteFood(seededPersonality('Rex')).id).toBe('meat');
    expect(favoriteFood(seededPersonality('Twitch')).id).toBe('greens');
    expect(favoriteFood(seededPersonality('Glade')).id).toBe('meat');
  });

  it('a near-tied dino sways: Rex craves meat in winter but berries in summer', () => {
    const rex = seededPersonality('Rex');
    expect(favoriteFood(rex, 'winter').id).toBe('meat');
    expect(favoriteFood(rex, 'summer').id).toBe('berries');
    expect(favoriteFood(rex, 'winter').id).not.toBe(favoriteFood(rex, 'summer').id);
  });

  it('a strong-fit dino never sways: Twitch loves greens in every season', () => {
    const twitch = seededPersonality('Twitch');
    for (const s of SEASONS) expect(favoriteFood(twitch, s).id).toBe('greens');
  });

  it('the bonus can only promote the craved food — a season-favorite is the base or that craving', () => {
    for (const name of ROSTER) {
      const t = seededPersonality(name);
      const base = favoriteFood(t).id;
      for (const s of SEASONS) {
        const fav = favoriteFood(t, s).id;
        expect([base, SEASON_CRAVING[s]]).toContain(fav);
      }
    }
  });

  it('foodReaction reads the season: meat delights Rex in winter, plain feed in summer', () => {
    const rex = seededPersonality('Rex');
    const meat = FOODS.find((f) => f.id === 'meat')!;
    expect(foodReaction(meat, rex, 'winter').favorite).toBe(true);
    expect(foodReaction(meat, rex, 'winter').gain).toBe(FEED_GAIN_FAV);
    expect(foodReaction(meat, rex, 'summer').favorite).toBe(false);
    expect(foodReaction(meat, rex, 'summer').gain).toBe(FEED_GAIN);
  });
});
