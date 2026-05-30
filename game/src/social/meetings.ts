/**
 * NPC-to-NPC meetings — a symmetric per-pair tally of how often two dinos
 * have crossed paths. Pure (no Phaser). This is the seed of pairwise
 * affinity (BACKLOG-013); for now it just counts.
 */

export type Meetings = Record<string, number>;

/** Order-independent key for a pair of dino names. */
export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|');
}

/** Increment the meeting count for a pair. Returns a new map; ignores self-meets. */
export function recordMeet(m: Meetings, a: string, b: string): Meetings {
  if (a === b) return m;
  const key = pairKey(a, b);
  return { ...m, [key]: (m[key] ?? 0) + 1 };
}
