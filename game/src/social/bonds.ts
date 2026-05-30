/**
 * Pairwise NPC bonds — how close two dinos are (0–100), built up by meeting
 * and by huddling together at night. Pure (no Phaser). Symmetric per pair.
 */

import { pairKey } from './meetings';

export type Bonds = Record<string, number>;

const MAX_BOND = 100;

/** Strengthen the bond between two dinos by `delta`, clamped to [0, 100]. Returns a new map. */
export function strengthen(bonds: Bonds, a: string, b: string, delta: number, max = MAX_BOND): Bonds {
  if (a === b) return bonds;
  const key = pairKey(a, b);
  return { ...bonds, [key]: Math.max(0, Math.min(max, (bonds[key] ?? 0) + delta)) };
}

export function bondPoints(bonds: Bonds, a: string, b: string): number {
  return bonds[pairKey(a, b)] ?? 0;
}
