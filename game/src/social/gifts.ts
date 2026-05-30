/**
 * Gift reactions — how a dino feels about a present, from its personality.
 *
 * Pure TypeScript (no Phaser): Node-testable. The affinity delta is applied
 * by the friendship store (friendship.ts); this module only decides the
 * verdict + how much it moves.
 */

import type { Personality } from '../ai/personality';

export interface Gift {
  id: string;
  label: string;
  appeal: Partial<Personality>; // axis → weight in [-1, 1]
}

export const GIFTS: ReadonlyArray<Gift> = [
  { id: 'shell', label: 'shiny shell', appeal: { curiosity: 1 } },
  { id: 'flower', label: 'wildflower', appeal: { sociability: 1, agreeableness: 0.5 } },
  { id: 'rock', label: 'smooth rock', appeal: { energy: -1 } },
  { id: 'stick', label: 'sparring stick', appeal: { bravery: 1, energy: 0.5 } },
  { id: 'snack', label: 'mossy snack', appeal: { agreeableness: 1 } },
];

export type GiftVerdict = 'loved' | 'liked' | 'neutral' | 'disliked';

export interface GiftReaction {
  verdict: GiftVerdict;
  delta: number;
}

/** How well a gift fits a personality: Σ weight · (trait centered to [-1,1]). No traits → 0. */
export function giftScore(gift: Gift, traits?: Personality): number {
  if (!traits) return 0;
  let score = 0;
  for (const key of Object.keys(gift.appeal) as (keyof Personality)[]) {
    const weight = gift.appeal[key] ?? 0;
    score += weight * (traits[key] * 2 - 1);
  }
  return score;
}

export function giftReaction(gift: Gift, traits?: Personality): GiftReaction {
  const score = giftScore(gift, traits);
  if (score >= 0.6) return { verdict: 'loved', delta: 12 };
  if (score >= 0.2) return { verdict: 'liked', delta: 6 };
  if (score <= -0.2) return { verdict: 'disliked', delta: -4 };
  return { verdict: 'neutral', delta: 1 };
}

const VERDICT_PHRASE: Record<GiftVerdict, string> = {
  loved: 'loved',
  liked: 'liked',
  neutral: 'shrugged at',
  disliked: 'disliked',
};

export function verdictPhrase(verdict: GiftVerdict): string {
  return VERDICT_PHRASE[verdict];
}
