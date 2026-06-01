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

/** The single food that best fits a personality. Stable: first max wins on FOODS order. */
export function favoriteFood(traits: Personality): Food {
  let best = FOODS[0];
  let bestScore = -Infinity;
  for (const food of FOODS) {
    const score = giftScore(food as Gift, traits); // Food is structurally a Gift (both expose `appeal`)
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
export function foodReaction(food: Food, traits?: Personality): FoodReaction {
  const favorite = !!traits && food.id === favoriteFood(traits).id;
  return {
    favorite,
    gain: favorite ? FEED_GAIN_FAV : FEED_GAIN,
    emoji: favorite ? '😋' : '🙂',
  };
}
