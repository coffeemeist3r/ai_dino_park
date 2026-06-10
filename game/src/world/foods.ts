/**
 * Food favorites (BACKLOG-061) — the hatch feed has a flavor and each dino has
 * an opinion. A dino's favorite food is the one that best fits its personality,
 * scored with the very same gift-fit math (giftScore) — so a food is just a gift
 * dropped through the lid (see studio/lore/vivarium.md). Eating your favorite is
 * extra-happy; otherwise it's plain feed.
 *
 * Pure (no Phaser): Node-testable. WorldScene turns these verdicts into the
 * falling sprite, the rush, the bump, and the 😋/🙂 flash.
 */

import type { Personality } from '../ai/personality';
import { giftScore, type Gift } from '../social/gifts';
import { FEED_GAIN, FEED_GAIN_FAV } from './feeding';
import type { Season } from './seasons';

export interface Food {
  id: string;
  emoji: string;
  label: string;
  appeal: Partial<Personality>; // axis → weight in [-1, 1], same shape as a gift
}

export const FOODS: ReadonlyArray<Food> = [
  { id: 'meat', emoji: '🍖', label: 'hunk of meat', appeal: { bravery: 1, energy: 0.5 } },
  { id: 'greens', emoji: '🌿', label: 'leafy greens', appeal: { agreeableness: 1, curiosity: -0.3 } },
  { id: 'fish', emoji: '🐟', label: 'silver fish', appeal: { curiosity: 1 } },
  { id: 'berries', emoji: '🍓', label: 'sweet berries', appeal: { sociability: 1, agreeableness: 0.5 } },
];

/**
 * Seasonal palates (BACKLOG-170) — each season nudges which food the bowl craves. The bonus is
 * small (0.4) so it only ever flips a dino whose top-two foods are near-tied: a strong-fit dino
 * stays loyal all year, an ambivalent one sways with the season. A craved food only ever *gains*
 * score, so it can promote itself but never reorder the rest.
 */
export const SEASON_CRAVING: Record<Season, string> = {
  spring: 'greens',
  summer: 'berries',
  fall: 'fish',
  winter: 'meat',
};

export const SEASON_CRAVING_BONUS = 0.4;

/** The food the bowl craves in `season`. */
export function seasonCraving(season: Season): Food {
  return FOODS.find((f) => f.id === SEASON_CRAVING[season]) ?? FOODS[0];
}

/**
 * The single food that best fits a personality. Stable: first max wins on FOODS order.
 * With `season` given, that season's craved food gets a small bonus (BACKLOG-170); omitting
 * `season` reproduces the cycle-061 verdict exactly.
 */
export function favoriteFood(traits: Personality, season?: Season): Food {
  let best = FOODS[0];
  let bestScore = -Infinity;
  for (const food of FOODS) {
    let score = giftScore(food as Gift, traits); // Food is structurally a Gift (both expose `appeal`)
    if (season && food.id === SEASON_CRAVING[season]) score += SEASON_CRAVING_BONUS;
    if (score > bestScore) {
      bestScore = score;
      best = food;
    }
  }
  return best;
}

export interface FoodReaction {
  favorite: boolean;
  gain: number;
  emoji: string;
}

/** How a dino feels about eating `food`: its favorite delights it, anything else is plain feed. */
export function foodReaction(food: Food, traits?: Personality, season?: Season): FoodReaction {
  const favorite = !!traits && food.id === favoriteFood(traits, season).id;
  return {
    favorite,
    gain: favorite ? FEED_GAIN_FAV : FEED_GAIN,
    emoji: favorite ? '😋' : '🙂',
  };
}
