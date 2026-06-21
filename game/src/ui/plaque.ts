/**
 * The Plaque (BACKLOG-058) — the engraved brass nameplate under the vivarium.
 * Sells the "specimen kept on a shelf" feel and surfaces a little emergent stat:
 * how many generations deep the family tree has grown. Pure (no Phaser): the
 * scene just renders these lines.
 */

/** A dino with optional parents — founders (roster) have none. */
export interface Lineaged {
  name: string;
  parents?: [string, string];
}

/**
 * Generation of one dino: founders are gen 1; a born dino is 1 + the deeper of
 * its two parents. Memoized, and safe against a missing/looping parent.
 */
export function generationOf(
  name: string,
  byName: Map<string, Lineaged>,
  memo = new Map<string, number>(),
  seen = new Set<string>(),
): number {
  if (memo.has(name)) return memo.get(name)!;
  const d = byName.get(name);
  if (!d || !d.parents || seen.has(name)) return 1; // founder, unknown, or cycle guard
  seen.add(name);
  const g = 1 + Math.max(generationOf(d.parents[0], byName, memo, seen), generationOf(d.parents[1], byName, memo, seen));
  seen.delete(name);
  memo.set(name, g);
  return g;
}

/** Deepest generation reached across all born dinos (1 when none have hatched yet). */
export function maxGeneration(born: Lineaged[]): number {
  const byName = new Map(born.map((b) => [b.name, b] as const));
  const memo = new Map<string, number>();
  let max = 1;
  for (const b of born) max = Math.max(max, generationOf(b.name, byName, memo));
  return max;
}

export interface PlaqueStats {
  population: number;
  day: number;
  generations: number;
  /** Current zone display name (BACKLOG-143). Absent → the bowl, so old callers read unchanged. */
  zone?: string;
  /** Park stockpile readout line content (BACKLOG-285), e.g. '🪵 3 · 🪨 1'. Absent/empty → no line. */
  stockpile?: string;
}

/** The engraved lines of the plaque — two stats lines, plus a third stores line once anything is banked. */
export function plaqueLines(s: PlaqueStats): string[] {
  const place = s.zone ?? 'Pocket Cretaceous';
  const specimens = `${s.population} specimen${s.population === 1 ? '' : 's'}`;
  const gens = `${s.generations} generation${s.generations === 1 ? '' : 's'}`;
  const lines = [`VIVARIUM · ${place}`, `Day ${s.day} · ${specimens} · ${gens}`];
  if (s.stockpile) lines.push(`Stores · ${s.stockpile}`);
  return lines;
}
