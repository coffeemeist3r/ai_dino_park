/**
 * Per-zone food stockpile (BACKLOG-446) — the food twin of the resource pile (285/328). A harvest (145/433)
 * used to drop into the feeding loop and vanish; there was no *banked food*, so nothing could flow between
 * zones, the demand read (438) had nothing to point at, and a carrier had nothing to ferry (444). This is
 * the missing spine: a share of each harvest banks by food id into the zone's own pile, capped like
 * resources, read on the zone-map lens. You can't ferry, spend, or read food you never stored.
 *
 * Pure (no Phaser): the bank/cap/readout are decided here and unit-tested; WorldScene owns the harvest
 * hook, persistence, and the lens draw. Structural twin of world/resource.ts's Stockpile — same shape,
 * keyed by FOODS id instead of ResourceKind so any farmable crop banks without a new enum.
 */

import { FOODS } from './foods';

/** A zone's banked food: FOODS id → count. Partial like Stockpile — absent id reads 0. */
export type FoodPile = Partial<Record<string, number>>;

/**
 * Per-food-id cap (BACKLOG-446) — mirrors resource.ts STOCKPILE_CAP. Banking a kind already at cap stalls
 * (the harvest still drops into the feeding loop; only the stored surplus stops growing) until 444/447 spend
 * it back down.
 */
export const FOOD_STOCKPILE_CAP = 6;

/** Is this food id's pile at (or over) the per-id cap — i.e. banking more of it would stall? */
export function foodAtCap(pile: FoodPile, id: string): boolean {
  return (pile[id] ?? 0) >= FOOD_STOCKPILE_CAP;
}

/**
 * Bank one harvested unit of `id` into the zone's food pile. Pure — returns a new map, never mutates `pile`.
 * Clamps at FOOD_STOCKPILE_CAP: an id already at cap returns the pile unchanged (twin of bankResource).
 */
export function bankFood(pile: FoodPile, id: string): FoodPile {
  if (foodAtCap(pile, id)) return pile;
  return { ...pile, [id]: (pile[id] ?? 0) + 1 };
}

/** A pile's total across all food ids. */
export function foodPileTotal(pile: FoodPile): number {
  return Object.keys(pile).reduce<number>((s, k) => s + (pile[k] ?? 0), 0);
}

/**
 * One-line glyph readout for the zone-map lens (`🍓 2 · 🥬 1`) — lists only ids banked (>0), in FOODS order
 * so the read is stable, '' when the pile is empty. Twin of resource.ts stockpileLine.
 */
export function foodPileLine(pile: FoodPile): string {
  return FOODS.filter((f) => (pile[f.id] ?? 0) > 0)
    .map((f) => `${f.emoji} ${pile[f.id]}`)
    .join(' · ');
}
