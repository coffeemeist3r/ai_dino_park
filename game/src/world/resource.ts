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
export const RESOURCE_SPAWN_CHANCE = 0.05; // per spawn-roll (only rolled when none is present)

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
