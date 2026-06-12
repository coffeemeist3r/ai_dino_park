/**
 * Dawn chorus (BACKLOG-192) — the order the bowl wakes in. Pure trait math: no Phaser,
 * no AudioContext, no clock. Vitest runs it in Node; WorldScene schedules the chirps.
 *
 * The voices shipped in cycle 44 (chirp.ts); this decides *when* you hear each one. The
 * same `energy` axis that clips a dino's call short now also sets how eagerly it greets
 * the day: the most energetic dino chirps first, the calmest (the grudging night-owl)
 * last, the rest spread across the gap by how energetic they are. So the morning rolls
 * across the cast as a personality read you can hear with your eyes closed.
 */

import type { Personality } from '../ai/personality';

/** The dawn boundary — the warm visible dawn (the 07:00 day/night keyframe). */
export const DAWN_HOUR = 7;

/** Total stagger across the whole cast, ms. Short: a desk companion waking, not an alarm. */
export const CHORUS_SPREAD_MS = 1800;

export interface ChorusEntry {
  name: string;
  /** When this dino chirps, ms after the chorus begins. First entry is always 0. */
  delayMs: number;
}

/**
 * The cast ordered by descending energy (early risers first), each with a start delay.
 * Ties in energy break alphabetically by name, so the order is stable across runs.
 * An empty cast yields []; a cast of equal energies all chirp at once (every delay 0).
 */
export function chorusOrder(
  dinos: ReadonlyArray<{ name: string; traits: Personality }>,
): ChorusEntry[] {
  if (dinos.length === 0) return [];
  const sorted = [...dinos].sort(
    (a, b) => b.traits.energy - a.traits.energy || a.name.localeCompare(b.name),
  );
  const eMax = sorted[0].traits.energy;
  const eMin = sorted[sorted.length - 1].traits.energy;
  const span = eMax - eMin || 1; // equal energies → every delay collapses to 0
  return sorted.map((d) => ({
    name: d.name,
    delayMs: Math.round((CHORUS_SPREAD_MS * (eMax - d.traits.energy)) / span),
  }));
}
