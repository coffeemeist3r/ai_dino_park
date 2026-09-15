/**
 * BACKLOG-068 — acquired taste, where it crosses module lines.
 *
 * `palate.test.ts` owns the record. This owns the three places the record changes what the park does:
 * the reaction table, the refusal exemption, and the book's line.
 */

import { describe, it, expect } from 'vitest';
import { FEED_GAIN, FEED_GAIN_FAV, FEED_GAIN_WARM, PICKY_AGREE, PICKY_HUNGER, refusesFood } from './feeding';
import { FOODS, favoriteFood, foodReaction } from './foods';
import { FAVORITE_UNKNOWN, WARMED_CLAUSE, menuLine } from './menu';
import { seededPersonality } from '../ai/personality';
import { ROSTER } from '../entities/roster';

const traits = seededPersonality('Rex');
const fav = favoriteFood(traits);
const notFav = FOODS.find((f) => f.id !== fav.id)!;

describe('the reaction table', () => {
  it('is ordered plain < warmed < favorite, so a later tune of one cannot silently invert it', () => {
    expect(FEED_GAIN).toBeLessThan(FEED_GAIN_WARM);
    expect(FEED_GAIN_WARM).toBeLessThan(FEED_GAIN_FAV);
  });

  it('pays plain feed for a food nobody has come round to', () => {
    const r = foodReaction(notFav, traits);
    expect(r).toMatchObject({ favorite: false, warmed: false, gain: FEED_GAIN, emoji: '🙂' });
  });

  it('pays the middle gain for a food it has come round to', () => {
    const r = foodReaction(notFav, traits, undefined, true);
    expect(r).toMatchObject({ favorite: false, warmed: true, gain: FEED_GAIN_WARM, emoji: '😌' });
  });

  it('pays a favorite as a favorite, warmed or not — the two never overlap', () => {
    for (const warmed of [false, true]) {
      const r = foodReaction(fav, traits, undefined, warmed);
      expect(r, `warmed=${warmed}`).toMatchObject({ favorite: true, warmed: false, gain: FEED_GAIN_FAV, emoji: '😋' });
    }
  });

  it('is unchanged for every caller that does not pass the new argument', () => {
    // The whole roster, so the 061/170 verdicts are demonstrably untouched by this cycle.
    for (const r of ROSTER) {
      const t = seededPersonality(r.name);
      for (const food of FOODS) {
        const before = foodReaction(food, t);
        expect(before.gain, `${r.name}/${food.id}`).toBe(before.favorite ? FEED_GAIN_FAV : FEED_GAIN);
      }
    }
  });
});

describe('a warmed food is never refused', () => {
  it('takes the same exemption the favorite has, across the whole prickly, well-fed grid', () => {
    for (let a = 0; a <= PICKY_AGREE; a += 0.05) {
      for (let h = 0; h < PICKY_HUNGER; h += 0.1) {
        expect(refusesFood(a, false, h, false), `unwarmed a=${a.toFixed(2)} h=${h.toFixed(2)}`).toBe(true);
        expect(refusesFood(a, false, h, true), `warmed a=${a.toFixed(2)} h=${h.toFixed(2)}`).toBe(false);
      }
    }
  });

  it('leaves every existing three-argument caller reading exactly as it did', () => {
    expect(refusesFood(0.1, false, 0)).toBe(refusesFood(0.1, false, 0, false));
  });
});

describe('the book line', () => {
  it('carries the warmed clause for a food the dino came round to', () => {
    const line = menuLine([notFav.id], fav, [notFav]);
    expect(line).toContain(`${WARMED_CLAUSE} ${notFav.emoji} ${notFav.label}`);
  });

  it('omits the clause entirely for a dino that has come round to nothing', () => {
    expect(menuLine([notFav.id], fav)).not.toContain(WARMED_CLAUSE);
  });

  it('says what it has learned beside what it has not — the first thing an early book can say', () => {
    const line = menuLine([notFav.id], fav, [notFav]);
    expect(line).toContain(FAVORITE_UNKNOWN);
    expect(line).toContain(WARMED_CLAUSE);
  });
});
