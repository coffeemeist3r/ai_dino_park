/**
 * The keeper's satchel (BACKLOG-546) — the stock the hatch spends from.
 *
 * Every other food in this park is accounted for: the granary banks it (446), spoilage bleeds it
 * (455/461), the ferry moves it between grounds (457), the tithe takes a cut (146), the plots grow it
 * (145). `dropFood` was the one hole in the ledger — it conjured a piece out of nothing, and had since
 * cycle 59. That read as weather while the drop was a random handful. As of BACKLOG-067 the keeper
 * *aims* it, and an aimed drop with no cost is a menu rather than a decision.
 *
 * The stock is a `FoodPile` — the same `food id -> count` map the zones bank into. A second type for the
 * same shape would be the duplication the CHARTER's reuse rule exists to stop.
 *
 * Not a difficulty knob. The founding stock is uneven rather than thin: the point is that *which* food
 * you drop is a choice between foods you have, never that the park runs dry and stops being playable.
 *
 * Pure (no Phaser): Node-testable. WorldScene owns the spend, the refill listener and the readout.
 */

import { FOODS } from './foods';
import { FOOD_STOCKPILE_CAP, type FoodPile } from './foodstore';
import { rand as worldRand } from './rng';

/**
 * What the keeper starts with — deliberately uneven, and deliberately above the floor (CHARTER v7's
 * corollary: the founding state exercises the system rather than sitting inert beneath it).
 *
 * A flat handful of everything is a supply you never notice. This one puts the interesting failure state
 * two keystrokes from a fresh save: one fish and two meat against four greens, so a keeper trying to
 * reach a meat-eater runs out of the thing that dino wants while still holding plenty of what it doesn't.
 *
 * The three farmed crops (roots, mushrooms, seeds) start at zero on purpose. The keeper gets those by
 * farming, which is what puts the plots inside this loop instead of beside it.
 */
export const FOUNDING_SATCHEL: FoodPile = { greens: 4, berries: 3, meat: 2, fish: 1 };

/** The ids the day boundary tops back up — the founding staples, not the farmed crops. */
export const SATCHEL_STAPLES: ReadonlyArray<string> = Object.keys(FOUNDING_SATCHEL);

/** How many of `id` the keeper is holding. An id never stocked reads 0. */
export function satchelCount(pile: FoodPile, id: string): number {
  return pile[id] ?? 0;
}

/** Nothing left at all — every id at zero (or absent). */
export function satchelEmpty(pile: FoodPile): boolean {
  return stockedIds(pile).length === 0;
}

/** The ids with something in them, in `FOODS` order so every read of a pile is stable. */
export function stockedIds(pile: FoodPile): string[] {
  return FOODS.filter((f) => satchelCount(pile, f.id) > 0).map((f) => f.id);
}

/**
 * Spend one of `id`. Returns a new pile, or **null** when there is none of that id — the caller turns
 * that null into the empty-handed drop rather than silently doing nothing (CHARTER: no silent failures).
 * Never mutates `pile`; an id spent to its last unit is dropped from the map rather than left at 0, so a
 * pile always reads the same whether an id was never stocked or was stocked and emptied.
 */
export function spendFromSatchel(pile: FoodPile, id: string): FoodPile | null {
  const have = satchelCount(pile, id);
  if (have <= 0) return null;
  const next = { ...pile };
  if (have === 1) delete next[id];
  else next[id] = have - 1;
  return next;
}

/**
 * The day boundary's top-up: each staple back to its founding count. A staple already at or above it is
 * left alone (so a harvest that pushed greens past four is not clawed back), and a farmed crop is never
 * touched — the only way to hold roots is to have grown them.
 */
export function refillSatchel(pile: FoodPile): FoodPile {
  const next = { ...pile };
  for (const id of SATCHEL_STAPLES) {
    const founding = FOUNDING_SATCHEL[id] ?? 0;
    if (satchelCount(next, id) < founding) next[id] = founding;
  }
  return next;
}

/** A harvested crop goes into the satchel too, capped like any other pile (twin of `bankFood`). */
export function bankToSatchel(pile: FoodPile, id: string, cap: number = FOOD_STOCKPILE_CAP): FoodPile {
  if (satchelCount(pile, id) >= cap) return pile;
  return { ...pile, [id]: satchelCount(pile, id) + 1 };
}

/**
 * The random handful, drawn from what the keeper actually has (BACKLOG-546).
 *
 * `dropFood` used to roll over all of `FOODS`, which is how the hatch produced roots on a day the keeper
 * had never grown one. The roll is now over stocked ids only, and answers **null** on an empty satchel —
 * so the auto slot meets the same empty-handed path an explicitly-loaded food does.
 */
export function rollFromSatchel(pile: FoodPile, rand: () => number = worldRand): string | null {
  const ids = stockedIds(pile);
  if (!ids.length) return null;
  return ids[Math.min(ids.length - 1, Math.floor(rand() * ids.length))];
}
