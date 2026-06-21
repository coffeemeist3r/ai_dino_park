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

/** Pick which kind appears — branch or stone, 50/50. */
export function pickKind(rand: () => number = Math.random): ResourceKind {
  return rand() < 0.5 ? 'branch' : 'stone';
}

/**
 * Shared per-kind park stockpile (BACKLOG-285) — where gathered resources bank. 146 raised a per-dino
 * tally that nothing read; this is the park-level total the rest of the build arc (286 craft, 029) spends.
 */
export type Stockpile = Partial<Record<ResourceKind, number>>;

/** Bank one gathered resource into the shared stockpile. Pure — returns a new map, never mutates `pile`. */
export function bankResource(pile: Stockpile, kind: ResourceKind): Stockpile {
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
