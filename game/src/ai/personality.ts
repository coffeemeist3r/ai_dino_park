/**
 * NPC personality — 5 axes, seeded deterministically from a name.
 *
 * Pure TypeScript (no Phaser): testable in Node. Traits are re-derived
 * from the dino's name on every load, so they're stable across reloads
 * without being written to the save file. describePersonality() renders
 * them into a phrase the NPCBrain can drop into a prompt.
 */

export interface Personality {
  curiosity: number; // 0 cautious .. 1 curious
  sociability: number; // 0 solitary .. 1 social
  energy: number; // 0 calm .. 1 energetic
  agreeableness: number; // 0 prickly .. 1 warm
  bravery: number; // 0 timid .. 1 bold
}

export const AXES: ReadonlyArray<{ key: keyof Personality; low: string; high: string }> = [
  { key: 'curiosity', low: 'cautious', high: 'curious' },
  { key: 'sociability', low: 'solitary', high: 'social' },
  { key: 'energy', low: 'calm', high: 'energetic' },
  { key: 'agreeableness', low: 'prickly', high: 'warm' },
  { key: 'bravery', low: 'timid', high: 'bold' },
];

/** 32-bit string hash (cyrb53-lite) — mixes well enough that short names diverge. */
export function hashSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — tiny deterministic PRNG returning 0..1. */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededPersonality(seed: string): Personality {
  const rand = mulberry32(hashSeed(seed));
  return {
    curiosity: rand(),
    sociability: rand(),
    energy: rand(),
    agreeableness: rand(),
    bravery: rand(),
  };
}

export function describePersonality(p: Personality): string {
  const traits: string[] = [];
  for (const axis of AXES) {
    const v = p[axis.key];
    if (v > 0.6) traits.push(axis.high);
    else if (v < 0.4) traits.push(axis.low);
  }
  return traits.length > 0 ? traits.join(', ') : 'even-tempered';
}
