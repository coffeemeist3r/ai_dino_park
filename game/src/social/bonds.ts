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

/**
 * The closest friend of `name` among `others` (BACKLOG-013) — the peer with the strongest pairwise bond,
 * provided it clears `floor`. Ties break to the lexicographically-smallest name (matching `comfort.ts` /
 * `homecoming.ts` `topBy`). Returns null when nobody clears the floor. The shared 013 pick the grief tic
 * (BACKLOG-414) reads; `comfort.ts` keeps its own copy (it layers a gratitude override on top).
 */
export function closestFriend(name: string, bonds: Bonds, others: string[], floor = 0): string | null {
  let best: { name: string; bond: number } | null = null;
  for (const o of others) {
    if (o === name) continue;
    const bond = bondPoints(bonds, name, o);
    if (!best || bond > best.bond || (bond === best.bond && o < best.name)) best = { name: o, bond };
  }
  return best && best.bond >= floor ? best.name : null;
}
