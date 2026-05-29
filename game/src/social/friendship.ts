/**
 * Player↔NPC friendship — affinity points and their heart display.
 *
 * Pure TypeScript (no Phaser): Node-testable. Points 0..100 map to 0..10
 * hearts. The store is a plain name→points map so it serializes straight
 * into the save (saveGame.ts).
 */

import type { Personality } from '../ai/personality';

export const MAX_POINTS = 100;
export const HEARTS_MAX = 10;
export const BASE_GAIN = 3;

export type Friendship = Record<string, number>;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function heartsFromPoints(points: number): number {
  return clamp(Math.floor(points / 10), 0, HEARTS_MAX);
}

/** Returns a new map with `name` adjusted by `delta`, clamped to [0, MAX_POINTS]. Does not mutate input. */
export function bumpPoints(f: Friendship, name: string, delta: number): Friendship {
  return { ...f, [name]: clamp((f[name] ?? 0) + delta, 0, MAX_POINTS) };
}

export function heartString(hearts: number): string {
  const h = clamp(hearts, 0, HEARTS_MAX);
  return '♥'.repeat(h) + '♡'.repeat(HEARTS_MAX - h);
}

/** Affinity gained from one greet — warm, social dinos warm to you faster. */
export function greetGain(traits?: Personality): number {
  if (!traits) return BASE_GAIN;
  const bonus = Math.round(2 * traits.agreeableness + traits.sociability);
  return clamp(BASE_GAIN + bonus, 0, HEARTS_MAX);
}
