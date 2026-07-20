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

/**
 * The pantry gets a door (BACKLOG-444) — the spend half of the food store. 446 banked food that nothing
 * could ever take back out; these decide *what* a zone hands a starving resident. WorldScene owns the
 * when (the `checkNeeds` gate: starving, no keeper drop in play, zone actually stocked).
 */

/** Remove one of `id` from a food pile (floored at 0). Pure — returns a new map, never mutates. Twin of
 *  resource.ts takeResource. */
export function takeFood(pile: FoodPile, id: string): FoodPile {
  const have = pile[id] ?? 0;
  if (have <= 0) return pile;
  return { ...pile, [id]: have - 1 };
}

/**
 * Which banked food a zone spends on a starving resident: its **favorite** when the zone has it banked,
 * else the most-stocked id — null when the pile is empty. The favorite preference is the distinctness
 * hook (being fed what *you* like out of your own zone's stores reads differently per dino); the
 * most-stocked fallback keeps the pantry draining its glut first. Deterministic — the FOODS-order filter
 * plus a stable sort breaks a count tie the same way pickCarry does.
 */
export function pickFoodToSpend(pile: FoodPile, favoriteId?: string): string | null {
  if (favoriteId && (pile[favoriteId] ?? 0) > 0) return favoriteId;
  const stocked = FOODS.filter((f) => (pile[f.id] ?? 0) > 0).map((f) => f.id);
  return [...stocked].sort((a, b) => (pile[b] ?? 0) - (pile[a] ?? 0))[0] ?? null;
}

/** The ticker line when a zone's stores feed one of its own (BACKLOG-444). No leading article: two of the
 *  three zone names already carry their own ("The Grove"), so `the ${zoneName}` reads as "the The Grove". */
export function storesFedLine(zoneName: string, name: string, emoji: string): string {
  return `${emoji} ${zoneName}'s stores fed ${name}`;
}

/** The memory the fed dino keeps; WorldScene folds this into the store. */
export function storesFedMemory(zoneName: string): string {
  return `you woke starving and ${zoneName}'s stores saw you through`;
}

/**
 * Food flows between zones (BACKLOG-447) — the food twin of the resource carry (329/356/429). Which banked
 * food id a crossing dino ferries `src → dest`, aimed at *need*:
 *  1. **Directed** by the demand read (438's `zoneWant`, passed as `wantId`): if `dest` wants that food,
 *     `src` has it banked, `dest` can still accept it (not at cap) AND holds strictly less of it than `src`,
 *     ferry it — the demand read becomes an actual mover.
 *  2. **Fallback (glut → lighter):** else the most-stocked id in `src` that `dest` can accept and holds
 *     strictly less of than `src`. The strict `dest < src` on every branch is what makes food flow *only*
 *     toward the lighter neighbour (never into an already-fuller zone) and keeps two crossings from
 *     ping-ponging one unit back and forth.
 *  3. `null` when nothing qualifies (src empty, dest fuller of every src id, or all dest-capped) — never lossy.
 * Pure, deterministic: the FOODS-order filter + stable count sort break a tie exactly like `pickCarry`.
 */
export function pickFoodCarry(src: FoodPile, dest: FoodPile, wantId?: string): string | null {
  const flows = (id: string) =>
    (src[id] ?? 0) > 0 && !foodAtCap(dest, id) && (dest[id] ?? 0) < (src[id] ?? 0);
  if (wantId && flows(wantId)) return wantId;
  const stocked = FOODS.filter((f) => flows(f.id)).map((f) => f.id);
  return [...stocked].sort((a, b) => (src[b] ?? 0) - (src[a] ?? 0))[0] ?? null;
}

/**
 * The courier's pride (BACKLOG-451) — a dino that ferries banked food across a zone edge (447) to a hungrier
 * neighbour keeps this, and greets a beat prouder for it (the trace rides the store into `recall` → the next
 * greeting). Twin of `storesFedMemory`. */
export function courierMemory(zoneName: string, foodEmoji: string): string {
  return `you carried ${foodEmoji} to ${zoneName} when its stores ran short`;
}

/** The pride bubble shown over the courier at the crossing (BACKLOG-451). */
export function courierLine(): string {
  return '📦';
}
