/**
 * The Plaque (BACKLOG-058) — the engraved brass nameplate under the vivarium.
 * Sells the "specimen kept on a shelf" feel and surfaces a little emergent stat:
 * how many generations deep the family tree has grown. Pure (no Phaser): the
 * scene just renders these lines.
 */

import { ZONES } from '../world/zones';

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
  /** Per-zone population readout (BACKLOG-316), e.g. '▸Pocket Cretaceous 4 · The Grove 2'. Absent/empty → no line. */
  zoneTally?: string;
}

/** The engraved lines of the plaque — two stats lines, an optional stores line, an optional zones line. */
export function plaqueLines(s: PlaqueStats): string[] {
  const place = s.zone ?? 'Pocket Cretaceous';
  const specimens = `${s.population} specimen${s.population === 1 ? '' : 's'}`;
  const gens = `${s.generations} generation${s.generations === 1 ? '' : 's'}`;
  const lines = [`VIVARIUM · ${place}`, `Day ${s.day} · ${specimens} · ${gens}`];
  if (s.stockpile) lines.push(`Stores · ${s.stockpile}`);
  if (s.zoneTally) lines.push(`Zones · ${s.zoneTally}`);
  return lines;
}

/**
 * The per-zone tally line (BACKLOG-316): each zone's name + head count, joined by ' · ', with a '▸'
 * marker on the keeper's active zone so the split world reads at a glance. Pure.
 */
export function zoneTallyLine(populations: Record<string, number>, activeZoneId: string): string {
  return ZONES.map((z) => `${z.id === activeZoneId ? '▸' : ''}${z.name} ${populations[z.id] ?? 0}`).join(' · ');
}

/**
 * The both-zone stores line (BACKLOG-357): each zone's already-formatted stockpile glyphs prefixed by its
 * name, '▸' on the keeper's active zone — so the player watches the two economies diverge without crossing.
 * A zone with an empty pile is omitted; both empty → '' (the caller then drops the Stores line entirely,
 * byte-identical to the pre-357 empty case). `stores` maps a zone id → its `stockpileLine` output, keeping
 * this glyph-agnostic (no resource import). Pure.
 */
export function zoneStoresLine(stores: Record<string, string>, activeZoneId: string): string {
  return ZONES.map((z) => ({ z, line: stores[z.id] ?? '' }))
    .filter((e) => e.line)
    .map((e) => `${e.z.id === activeZoneId ? '▸' : ''}${e.z.name} ${e.line}`)
    .join(' · ');
}
