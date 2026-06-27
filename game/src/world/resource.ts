/**
 * Resource gathering spine (BACKLOG-146) — the first beat of the resources→crafting→building arc.
 * A raw resource (a fallen branch or a shiny stone) occasionally appears in the bowl; a curious dino
 * notices it, walks over, and picks it up (a per-dino tally). Gathering only — banking into a shared
 * stockpile is BACKLOG-285, crafting is BACKLOG-286.
 *
 * Pure (no Phaser): the notice decision, the landing tile, and the spawn roll are all decided here and
 * unit-tested; WorldScene draws the glyph, drives the fetch off the world clock, and reuses the feeding
 * spine's `stepToward` (movement) + `reachedFood` (arrival) so this never reinvents either.
 *
 * Mirror of world/feeding.ts: food attracts the hungry by energy, a resource attracts the curious by
 * curiosity. Food stays the higher movement priority in WorldScene (a hungry rush wins a tug-of-war).
 */

import type { Tile } from './movement';
import { BOWL_ID, GROVE_ID } from './zones';

export type ResourceKind = 'branch' | 'stone';

export const RESOURCE_GLYPH: Record<ResourceKind, string> = { branch: '🪵', stone: '🪨' };

export const RESOURCE_RANGE = 6; // tiles — beyond this a resource goes unnoticed
const CURIOUS = 0.35; // curiosity at/above which a dino bothers to fetch
export const RESOURCE_SPAWN_CHANCE = 0.12; // per spawn-roll (only rolled when none is present)

/**
 * Legible gathering (BACKLOG-297): a freshly fallen resource sits for a grace window before any dino
 * fetches it, so the player actually catches it appearing instead of it vanishing the same tick a
 * curious dino reaches it. WorldScene ages the resource one step per `forceStep`.
 */
export const RESOURCE_GRACE_STEPS = 3;

/** Has a resource sat long enough (in world steps) to be fetched? */
export function resourceFetchable(ageSteps: number): boolean {
  return ageSteps >= RESOURCE_GRACE_STEPS;
}

export type GatherReaction = 'fetch' | 'ignore';

/** Does a dino notice and go fetch a resource, given its curiosity (0..1) and distance in tiles? */
export function noticeResource(curiosity: number, distTiles: number): GatherReaction {
  if (distTiles > RESOURCE_RANGE) return 'ignore';
  return curiosity >= CURIOUS ? 'fetch' : 'ignore';
}

/** Where a resource appears: a random in-bounds tile, kept off the very rim so it lands among the cast. */
export function resourceLanding(cols: number, rows: number, rand: () => number = Math.random): Tile {
  const span = (n: number) => 1 + Math.floor(rand() * Math.max(1, n - 2)); // [1, n-2]
  return { tileX: span(cols), tileY: span(rows) };
}

/** Whether a resource spawns this roll (only call when none is present). */
export function rollResource(rand: () => number = Math.random): boolean {
  return rand() < RESOURCE_SPAWN_CHANCE;
}

/**
 * Zone resource bias (BACKLOG-348) — each zone leans its roll toward its own character: the grove's
 * trees drop 🪵 branches, the bowl's open ground turns up 🪨 stones. A *lean*, not a lock — the off-kind
 * still rolls past `BIAS_WEIGHT` — so the two zone economies (328) gather *different* things and carry
 * between them (329) has a point. An unbiased/omitted zone keeps the old uniform 50/50 (back-compat).
 */
export const ZONE_BIAS: Record<string, ResourceKind> = { [BOWL_ID]: 'stone', [GROVE_ID]: 'branch' };
export const BIAS_WEIGHT = 0.75; // chance the favored kind rolls in its biased zone (vs 0.5 uniform)

/** Pick which kind appears — uniform 50/50 with no zone, or leaning to the zone's bias (348). */
export function pickKind(rand: () => number = Math.random, zone?: string): ResourceKind {
  const favored = zone ? ZONE_BIAS[zone] : undefined;
  if (!favored) return rand() < 0.5 ? 'branch' : 'stone';
  const other: ResourceKind = favored === 'branch' ? 'stone' : 'branch';
  return rand() < BIAS_WEIGHT ? favored : other;
}

/**
 * Shared per-kind park stockpile (BACKLOG-285) — where gathered resources bank. 146 raised a per-dino
 * tally that nothing read; this is the park-level total the rest of the build arc (286 craft, 029) spends.
 */
export type Stockpile = Partial<Record<ResourceKind, number>>;

/**
 * Stockpile capacity (BACKLOG-309) — the first economy constraint. The shared pile was unbounded, so
 * gathering accrued forever with no reason to spend. Each kind now caps; banking at cap stalls (the
 * gather is consumed but nothing banks) until a craft (286) spends the kind back below the cap.
 */
export const STOCKPILE_CAP = 8;

/** Is this kind's pile at (or over) the per-kind cap — i.e. banking more of it would stall? */
export function atCap(pile: Stockpile, kind: ResourceKind): boolean {
  return (pile[kind] ?? 0) >= STOCKPILE_CAP;
}

/**
 * Bank one gathered resource into the shared stockpile. Pure — returns a new map, never mutates `pile`.
 * Clamps at STOCKPILE_CAP (BACKLOG-309): a kind already at cap returns the pile unchanged.
 */
export function bankResource(pile: Stockpile, kind: ResourceKind): Stockpile {
  if (atCap(pile, kind)) return pile;
  return { ...pile, [kind]: (pile[kind] ?? 0) + 1 };
}

/** One-line glyph readout for the plaque (`🪵 3 · 🪨 1`); lists only kinds banked, '' when empty. */
export function stockpileLine(pile: Stockpile): string {
  return (Object.keys(RESOURCE_GLYPH) as ResourceKind[])
    .filter((k) => (pile[k] ?? 0) > 0)
    .map((k) => `${RESOURCE_GLYPH[k]} ${pile[k]}`)
    .join(' · ');
}

/**
 * First craft (BACKLOG-286) — the first resources→craft step. Once the shared stockpile (285) covers
 * one fixed recipe, a dino combines the banked branches and stones into a single crafted object: a cairn.
 * One recipe, one output; multi-recipe crafting and building stay deferred to 029. Pure — WorldScene owns
 * the placed sprite + persistence.
 */
export const CRAFT_RECIPE: Partial<Record<ResourceKind, number>> = { branch: 3, stone: 2 };
export const CAIRN_GLYPH = '🗿';

/** Can the stockpile afford one cairn — does it cover every kind the recipe needs? */
export function canCraft(pile: Stockpile): boolean {
  return (Object.keys(CRAFT_RECIPE) as ResourceKind[]).every((k) => (pile[k] ?? 0) >= (CRAFT_RECIPE[k] ?? 0));
}

/** Spend one cairn's worth of resources. Pure — returns a new pile minus the recipe, or null if unaffordable. */
export function craft(pile: Stockpile): Stockpile | null {
  if (!canCraft(pile)) return null;
  const next: Stockpile = { ...pile };
  for (const k of Object.keys(CRAFT_RECIPE) as ResourceKind[]) {
    next[k] = (next[k] ?? 0) - (CRAFT_RECIPE[k] ?? 0);
  }
  return next;
}

/**
 * Dino-built shelter (BACKLOG-315) — the second, larger structure beyond the cairn (286). At a higher
 * build bar a dino raises a lean-to: placed/persisted/zone-scoped exactly like the cairn, a real landmark
 * of its zone. The next resources→build beat. Pure (WorldScene owns the sprite + persistence); the
 * helpers below are structural twins of `canCraft`/`craft` over a richer recipe.
 *
 * The escalation gate is a *cairn count*, not just a pile size: the cairn auto-crafts at CRAFT_RECIPE on
 * every gather, draining the shared pile, so it can never climb to the richer SHELTER_RECIPE while cairns
 * keep firing. Once a zone has stacked SHELTER_AFTER_CAIRNS cairns, WorldScene stops draining it on cairns
 * and saves toward one shelter (one landmark per zone) — the lazy correct way to let the pile reach {6,4}
 * without touching the cairn path (so every cairn spec stays green).
 */
export const SHELTER_RECIPE: Partial<Record<ResourceKind, number>> = { branch: 6, stone: 4 };
export const SHELTER_GLYPH = '🛖';
export const SHELTER_AFTER_CAIRNS = 3; // cairns a zone stacks before it starts saving for a lean-to

/** Can the stockpile afford one shelter — does it cover every kind the richer recipe needs? */
export function canBuildShelter(pile: Stockpile): boolean {
  return (Object.keys(SHELTER_RECIPE) as ResourceKind[]).every((k) => (pile[k] ?? 0) >= (SHELTER_RECIPE[k] ?? 0));
}

/** Spend one shelter's worth of resources. Pure — returns a new pile minus the recipe, or null if unaffordable. */
export function buildShelter(pile: Stockpile): Stockpile | null {
  if (!canBuildShelter(pile)) return null;
  const next: Stockpile = { ...pile };
  for (const k of Object.keys(SHELTER_RECIPE) as ResourceKind[]) {
    next[k] = (next[k] ?? 0) - (SHELTER_RECIPE[k] ?? 0);
  }
  return next;
}

/**
 * Carry between zones (BACKLOG-329) — the first link between two per-zone piles (328). A dino crossing
 * zones ferries one banked resource from the pile it leaves into the pile it enters. These two pure
 * helpers decide *what* moves; WorldScene applies the transfer in `crossDino` (the visible crossing only).
 */

/**
 * Which kind to ferry `src → dest`: the most-stocked kind in `src` that `dest` can still accept (not at
 * cap), or null when nothing can move (src empty, or dest full for every kind src has). Deterministic —
 * the stable sort keeps `RESOURCE_GLYPH` order (branch before stone) on a count tie.
 */
export function pickCarry(src: Stockpile, dest: Stockpile): ResourceKind | null {
  const kinds = (Object.keys(RESOURCE_GLYPH) as ResourceKind[])
    .filter((k) => (src[k] ?? 0) > 0 && !atCap(dest, k))
    .sort((x, y) => (src[y] ?? 0) - (src[x] ?? 0));
  return kinds[0] ?? null;
}

/**
 * Directed carry (BACKLOG-356) — which kind to ferry `src → dest` so the trade route actively *balances*
 * the two economies instead of moving a random spare (329's `pickCarry`). Prefers the recipe kind `dest` is
 * most short of for its next craft (`CRAFT_RECIPE`, the always-on cairn) that `src` can supply (>0) and
 * `dest` can still accept (not at cap). When `dest` has no fillable craft shortfall, falls back to
 * `pickCarry` so a spare still moves (carry stays lossless and never a needless no-op). Deterministic — the
 * `RESOURCE_GLYPH` iteration order keeps branch-before-stone on a deficit tie (stable sort).
 */
export function directedCarry(
  src: Stockpile,
  dest: Stockpile,
  recipe: Partial<Record<ResourceKind, number>> = CRAFT_RECIPE,
): ResourceKind | null {
  const needed = (Object.keys(RESOURCE_GLYPH) as ResourceKind[])
    .map((k) => ({ k, deficit: (recipe[k] ?? 0) - (dest[k] ?? 0) }))
    .filter((x) => x.deficit > 0 && (src[x.k] ?? 0) > 0 && !atCap(dest, x.k))
    .sort((a, b) => b.deficit - a.deficit);
  return needed[0]?.k ?? pickCarry(src, dest);
}

/**
 * Zone-distinct craft (BACKLOG-377) — each zone builds the structure its resource bias (348) favors,
 * so the two zones' *built landscapes* diverge, not only their piles. The stone-rich bowl stacks 🗿
 * cairns; the branch-rich grove raises 🛖 lean-tos. This replaces the zone-agnostic cairn→lean-to
 * escalation (286/315 `SHELTER_AFTER_CAIRNS`) with a one-structure-per-zone choice keyed off ZONE_BIAS.
 * The pile-math (`craft`/`buildShelter`) and recipes are unchanged — only the *selection* moves here.
 */
export type Structure = 'cairn' | 'shelter';

/** A zone's bias kind → the landmark it raises: stone stacks cairns, branch raises lean-tos. */
export const STRUCTURE_BY_BIAS: Record<ResourceKind, Structure> = { stone: 'cairn', branch: 'shelter' };

/** Which structure a zone builds, by its bias. An unbiased/unknown zone → 'cairn' (286 default, back-compat). */
export function zoneStructure(zone?: string): Structure {
  const bias = zone ? ZONE_BIAS[zone] : undefined;
  return bias ? STRUCTURE_BY_BIAS[bias] : 'cairn';
}

/** The recipe a zone's structure costs — the cairn recipe (286) or the richer lean-to recipe (315). */
export function structureRecipe(zone?: string): Partial<Record<ResourceKind, number>> {
  return zoneStructure(zone) === 'shelter' ? SHELTER_RECIPE : CRAFT_RECIPE;
}

/** Remove one of `kind` from a pile (floored at 0). Pure — returns a new map, never mutates. */
export function takeResource(pile: Stockpile, kind: ResourceKind): Stockpile {
  const have = pile[kind] ?? 0;
  if (have <= 0) return pile;
  return { ...pile, [kind]: have - 1 };
}
