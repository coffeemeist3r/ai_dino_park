/**
 * Comforting nuzzle (BACKLOG-130) — "there there".
 *
 * Pure (no Phaser, no WebLLM): the dino-to-dino half of the attention economy.
 * When the homecoming makes a near-tied runner-up sulk (`homecoming.ts` →
 * `jealous`), this picks the sulker's *closest friend* — the dino with the
 * strongest pairwise bond (BACKLOG-013) — to cross the bowl and console it.
 * The bond between them deepens a little; consolation is itself a friendship
 * beat. A poorly-integrated dino with no real friend (every bond below the
 * floor) gets no one — which is its own kind of telling.
 */

import { bondPoints, type Bonds } from '../social/bonds';

/** A friend must be at least this close (pairwise bond) to bother crossing — one huddle's worth. */
export const COMFORT_BOND_FLOOR = 8;

/** How much the comforter↔sulker bond grows from the consolation — small; the gesture is the point. */
export const COMFORT_BOND = 2;

/**
 * The sulker's closest friend among `names`: the peer (never the sulker itself)
 * with the highest pairwise bond, provided that bond clears `COMFORT_BOND_FLOOR`.
 * Ties break to the lexicographically-smallest name (matching `homecoming.ts`
 * `topBy`). Returns null when no peer is close enough to come over.
 */
export function comforter(sulker: string, bonds: Bonds, names: string[]): string | null {
  let best: { name: string; bond: number } | null = null;
  for (const name of names) {
    if (name === sulker) continue;
    const bond = bondPoints(bonds, sulker, name);
    if (!best || bond > best.bond || (bond === best.bond && name < best.name)) {
      best = { name, bond };
    }
  }
  return best && best.bond >= COMFORT_BOND_FLOOR ? best.name : null;
}

/** The floating consolation line over the comforter (contains both names + 🫂). */
export function comfortLine(friend: string, sulker: string): string {
  return `${friend}: There there, ${sulker}. 🫂`;
}

/** The memory the comforted dino keeps; WorldScene folds this into the store. */
export function comfortMemory(friend: string): string {
  return `${friend} came over to comfort me`;
}
