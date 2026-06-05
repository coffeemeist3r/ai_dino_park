/**
 * Repairing a jealous slight (BACKLOG-125) — "you noticed me".
 *
 * Pure (no Phaser, no WebLLM): the healing half of the jealous nuzzle
 * (BACKLOG-120). When the keeper comes home, a near-tied runner-up sulks
 * (`homecoming.ts` → `jealous`). If the keeper then walks over and greets that
 * slighted dino, the slight flips: an outsized affinity bump (more than a normal
 * greet earns), a `😊` "you noticed me" beat, and a memory that the keeper made
 * it right. Jealousy, it turns out, is repairable through attention.
 */

import { greetGain } from '../social/friendship';
import type { Personality } from '../ai/personality';

/** Extra points a repair greet earns on top of a normal greet — over half a heart more. */
export const REPAIR_BONUS = 6;

/** A repair greet's affinity gain: a normal greet (warmth/sociability still scale) plus the bonus. */
export function repairGain(traits?: Personality): number {
  return greetGain(traits) + REPAIR_BONUS;
}

/** The floating line over the repaired dino (contains the name + 😊). */
export function repairLine(name: string): string {
  return `${name}: You noticed me! 😊`;
}

/** The memory the repaired dino keeps; WorldScene folds this into the store. */
export function repairMemory(name: string): string {
  return `the keeper noticed ${name} after all`;
}
