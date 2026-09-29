/**
 * Pairwise NPC bonds — how close two dinos are (0–100), built up by meeting
 * and by huddling together at night. Pure (no Phaser). Symmetric per pair.
 */

import { pairKey } from './meetings';

export type Bonds = Record<string, number>;

const MAX_BOND = 100;

/** The bump one ambient meeting gives a pair that has never met. */
export const BOND_PER_MEET = 4;

/**
 * The bump one ambient meeting gives a pair already at `bond` (BACKLOG-567). It shrinks as the pair nears
 * the cap, so the graph approaches 100 without arriving: with a flat 4 per meeting most pairs hit 100 about
 * four real minutes into a fresh park, and past that every "who is closest?" was answered by name order.
 * Now forty meetings still reads closer than ten. Only the repeated ambient meeting uses it; one-off beats
 * (comfort, gratitude, wonder) stay flat.
 */
export function meetGain(bond: number): number {
  return BOND_PER_MEET * (1 - Math.min(MAX_BOND, Math.max(0, bond)) / MAX_BOND);
}

/** The share of its distance to rest a bond gives up each ambient step (BACKLOG-570). */
export const BOND_DRIFT = 0.004;

/**
 * A friendship not kept up cools (BACKLOG-570): each bond above `rest` moves `rate` of the way toward it.
 * Nothing at or under rest moves, so drift alone never crosses a floor. `rest` is a parameter because the
 * floor lives in `world/loner.ts`, which imports this file. Against `meetGain` a pair meeting every step
 * settles near 92 instead of creeping to the cap; a pair apart halves its distance to rest in ~170 steps.
 */
export function driftBonds(bonds: Bonds, rest: number, rate = BOND_DRIFT): Bonds {
  let out: Bonds | null = null;
  for (const [key, v] of Object.entries(bonds)) {
    if (v <= rest) continue;
    out ??= { ...bonds };
    out[key] = rest + (v - rest) * (1 - rate);
  }
  return out ?? bonds;
}

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
