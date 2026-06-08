/**
 * Greeting tones — how the keeper chooses to say hello, and how each dino takes it.
 *
 * Pure TypeScript (no Phaser): Node-testable. Mirrors social/gifts.ts — a tone has an
 * `appeal` over personality axes, the fit is scored the same way, and the verdict decides
 * the affinity delta. Same tone, different dino → different reaction; that's the point.
 */

import type { Personality } from '../ai/personality';

export type ToneId = 'warm' | 'tease' | 'honest';

export interface Tone {
  id: ToneId;
  label: string;
  appeal: Partial<Personality>; // axis → weight in [-1, 1]
  /** Diary line filed when the keeper greets a dino this way. */
  memory: string;
}

// Menu order is 1 / 2 / 3.
export const TONES: ReadonlyArray<Tone> = [
  {
    id: 'warm',
    label: 'Warm',
    appeal: { agreeableness: 1, sociability: 0.5 },
    memory: 'the keeper greeted me warmly',
  },
  {
    id: 'tease',
    label: 'Tease',
    appeal: { bravery: 1, energy: 0.5, agreeableness: -0.5 },
    memory: 'the keeper teased me',
  },
  {
    id: 'honest',
    label: 'Honest',
    appeal: { curiosity: 1, bravery: 0.5 },
    memory: 'the keeper spoke to me honestly',
  },
];

export type ToneVerdict = 'loved' | 'liked' | 'neutral' | 'clashed';

export interface ToneReaction {
  verdict: ToneVerdict;
  delta: number;
}

/** How well a tone fits a personality: Σ weight · (trait centered to [-1,1]). No traits → 0. */
export function toneScore(tone: Tone, traits?: Personality): number {
  if (!traits) return 0;
  let score = 0;
  for (const key of Object.keys(tone.appeal) as (keyof Personality)[]) {
    const weight = tone.appeal[key] ?? 0;
    score += weight * (traits[key] * 2 - 1);
  }
  return score;
}

/**
 * Verdict + affinity delta for greeting a dino with this tone. Deltas are smaller than gifts'
 * (gifts.ts) because greets recur — a tone nudges the bond, a gift moves it.
 */
export function toneReaction(tone: Tone, traits?: Personality): ToneReaction {
  const score = toneScore(tone, traits);
  if (score >= 0.6) return { verdict: 'loved', delta: 5 };
  if (score >= 0.2) return { verdict: 'liked', delta: 3 };
  if (score <= -0.2) return { verdict: 'clashed', delta: -2 };
  return { verdict: 'neutral', delta: 1 };
}

export function toneById(id: ToneId): Tone {
  return TONES.find((t) => t.id === id) ?? TONES[0];
}

export function toneLabel(id: ToneId): string {
  return toneById(id).label;
}

const PAST_TONE: Record<ToneId, string> = {
  warm: 'warm',
  tease: 'teasing',
  honest: 'honest',
};

/** The "remembered trace" line for the menu header. Empty when the dino has no last tone. */
export function lastToneLine(id: ToneId | undefined): string {
  if (!id) return '';
  return `Last time you were ${PAST_TONE[id]} with them.`;
}
