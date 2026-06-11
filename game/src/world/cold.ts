/**
 * Cold-night shiver (BACKLOG-179) — the dino left out of the winter den. Cycle 171 made the
 * winter den pack; this reads the *other* half: a dino that never huddled across a winter night
 * sleeps cold, and at morning it shivers and remembers it.
 *
 * Pure TypeScript (no Phaser): Node-testable. Only deep winter is cold enough to leave a mark —
 * the warm seasons cost a sleeper nothing.
 */

import type { Season } from './seasons';

/** The only season cold enough to leave a dino shivering. */
export const COLD_SEASON: Season = 'winter';

/** Did a dino sleep out in the cold? True only on a winter night it never once huddled. */
export function sleptCold(huddledTonight: boolean, season: Season): boolean {
  return season === COLD_SEASON && !huddledTonight;
}

/** The shiver bubble floated over a dino that slept cold (morning after a winter night). */
export function coldShiver(): string {
  return '🥶 brr… a cold night, slept alone';
}

/** The memory a cold-slept dino files — woven into its next-morning greeting context. */
export function coldMemory(): string {
  return 'shivered through a cold night, slept alone 🥶';
}
