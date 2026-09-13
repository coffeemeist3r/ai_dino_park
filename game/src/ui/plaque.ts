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
  /** The keeper's own stock (BACKLOG-546), from `foodPileLine`. Absent/empty → no line. Sits with the
   *  park's stores rather than with the keeper lines below: it is a count of food, and it reads next to
   *  the other count of food. */
  satchel?: string;
  /** Per-zone population readout (BACKLOG-316), e.g. '▸Pocket Cretaceous 4 · The Grove 2'. Absent/empty → no line. */
  zoneTally?: string;
  /** What this ground owes a day (BACKLOG-536), from `upkeepLine`. Absent/empty → no line — and a ground
   *  under the bill's floor produces an empty string, so most grounds stay exactly as they read before. */
  upkeep?: string;
  /** How long this sitting has run (BACKLOG-542), from `sittingLine`. Absent/empty → no line. Sits
   *  directly above the streak: both lines are about the keeper, and this is the one about *now*. */
  sitting?: string;
  /** The keeper's own attendance (BACKLOG-122), from `streakLine`. Absent/empty → no line. Last on the
   *  brass on purpose: every line above it is about the park, and this one is about you. */
  streak?: string;
}

/**
 * The engraved lines of the plaque — two stats lines, then five optional ones: stores, zones, what this
 * ground owes a day (536), how long this sitting has run (542) and how many days running the keeper has
 * turned up (122).
 *
 * Every optional line is absent-means-nothing, so a caller that passes none of them gets byte-identical
 * output to the pre-154 plaque — which is what lets a hundred existing literals across this suite stay
 * untouched, the `bookLines(rows, away = [])` precedent from cycle 153.
 */
export function plaqueLines(s: PlaqueStats): string[] {
  const place = s.zone ?? 'Pocket Cretaceous';
  const specimens = `${s.population} specimen${s.population === 1 ? '' : 's'}`;
  const gens = `${s.generations} generation${s.generations === 1 ? '' : 's'}`;
  const lines = [`VIVARIUM · ${place}`, `Day ${s.day} · ${specimens} · ${gens}`];
  if (s.stockpile) lines.push(`Stores · ${s.stockpile}`);
  if (s.satchel) lines.push(`Satchel · ${s.satchel}`);
  if (s.zoneTally) lines.push(`Zones · ${s.zoneTally}`);
  if (s.upkeep) lines.push(`Upkeep · ${s.upkeep}`);
  if (s.sitting) lines.push(`Sitting · ${s.sitting}`);
  if (s.streak) lines.push(`Keeper · ${s.streak}`);
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
