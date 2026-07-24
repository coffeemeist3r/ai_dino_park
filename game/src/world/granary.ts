/**
 * The granary (BACKLOG-454) — the join the milestone was missing between the build arc (146/286/315/417)
 * and the food economy (446/444/447). For all the landmarks a zone raises, its pantry stayed pinned at a
 * flat `FOOD_STOCKPILE_CAP`; building lifted only an abstract prosperity number. The granary changes that:
 * a zone that has raised enough landmarks earns the right to put one up, and a *standing* granary lifts that
 * zone's food cap — so building becomes how a ground earns a bigger surplus. Plenty you build toward, the
 * source side of "the economy has weight" (M7).
 *
 * Pure (no Phaser): the gate, the spend, and the cap lift are decided here and unit-tested. WorldScene owns
 * the placed sprite, persistence, and the food-cap wiring (it passes `granaryFoodCap` into foodstore).
 *
 * A fourth structure beyond the per-zone cairn/lean-to/thatch (377/417), but *not* a bias landmark — it's a
 * gated upgrade with one fixed recipe any zone can earn (its own gather plus carry/barter), so it's kept out
 * of the `Structure`/`ZONE_BIAS` tables and modelled here.
 */

import type { ResourceKind, Stockpile } from './resource';
import { FOOD_STOCKPILE_CAP } from './foodstore';

export const GRANARY_GLYPH = '🏛️';

/** One fixed recipe for every zone (unlike the bias landmarks): a real mixed investment, earnable by any
 *  zone via its own gather plus inter-zone carry (329) / barter (358). */
export const GRANARY_RECIPE: Partial<Record<ResourceKind, number>> = { branch: 3, stone: 3 };

/** Base landmarks (cairns + lean-tos + thatches) a zone must have raised before it can put up a granary —
 *  the "has built enough" gate. Granaries themselves don't count toward it (see WorldScene `baseLandmarks`). */
export const GRANARY_AFTER_STRUCTURES = 3;

/** How much a standing granary lifts its zone's per-food-id cap above the flat `FOOD_STOCKPILE_CAP`. */
export const GRANARY_FOOD_BONUS = 3;

/**
 * Can this zone put up a granary now? It must not already have one, must have raised at least
 * `GRANARY_AFTER_STRUCTURES` base landmarks, and its pile must cover `GRANARY_RECIPE`. The `!hasGranary`
 * guard keeps it one-per-zone; enforced here so no caller can skip it.
 */
export function canBuildGranary(pile: Stockpile, landmarks: number, hasGranary: boolean): boolean {
  if (hasGranary || landmarks < GRANARY_AFTER_STRUCTURES) return false;
  return (Object.keys(GRANARY_RECIPE) as ResourceKind[]).every((k) => (pile[k] ?? 0) >= (GRANARY_RECIPE[k] ?? 0));
}

/** Spend one granary's worth of resources. Pure — a new pile minus the recipe, or null when unaffordable
 *  (twin of `buildStructureFor`). Does not re-check the landmark gate; call after `canBuildGranary`. */
export function buildGranary(pile: Stockpile): Stockpile | null {
  const kinds = Object.keys(GRANARY_RECIPE) as ResourceKind[];
  if (!kinds.every((k) => (pile[k] ?? 0) >= (GRANARY_RECIPE[k] ?? 0))) return null;
  const next: Stockpile = { ...pile };
  for (const k of kinds) next[k] = (next[k] ?? 0) - (GRANARY_RECIPE[k] ?? 0);
  return next;
}

/** A zone's per-food-id cap: the flat `FOOD_STOCKPILE_CAP`, lifted by `GRANARY_FOOD_BONUS` when a granary
 *  stands. Threaded into foodstore's `bankFood`/`foodAtCap`/`pickFoodCarry` by WorldScene. */
export function granaryFoodCap(hasGranary: boolean): number {
  return FOOD_STOCKPILE_CAP + (hasGranary ? GRANARY_FOOD_BONUS : 0);
}
