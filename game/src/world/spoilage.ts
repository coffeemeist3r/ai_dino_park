/**
 * A pantry that spoils (BACKLOG-455) — the *sink* the food economy was missing. 446 banked food that was
 * immortal: a zone that stacked a glut sat on it forever, so nothing spent down and — because the ferry
 * (447) only flows toward a *lighter* neighbour — two full zones deadlocked and the milestone's flows went
 * stagnant. The granary (454) gave the economy a source (build to lift your cap); this gives it a cost. A
 * hoard sitting at/near its zone's cap bleeds one unit per in-game day toward a safe floor, so plenty you
 * don't move stops being free and the pressure to ferry, spend (444), and eat stays live.
 *
 * Deliberately gentle and **self-limiting**: only food at/near cap spoils, and it stops at a floor
 * (`cap - SPOIL_MARGIN - 1`), so a zone that is actually circulating (piles below the near-cap band) is
 * never touched and a static hoard bleeds a little, then holds — never enough to starve anyone.
 *
 * Pure (no Phaser): the decay is decided here and unit-tested. WorldScene fires it once per in-game day on
 * a live-only day hook, passing each zone's granary-aware cap. Twin of foodstore's bank/take shape.
 */

import { FOOD_STOCKPILE_CAP, type FoodPile } from './foodstore';

/**
 * How close to the cap counts as a "hoard" that spoils — the calibration knob. At 1, an id at cap or one
 * below it spoils, so a static pile bleeds to a floor of `cap - 2` and stops (6→5→4·, a granary'd 9→8→7·).
 * Tune here, not at the call site.
 */
export const SPOIL_MARGIN = 1;

/** Is this id's count a hoard at/near `cap` — i.e. would it lose a unit this pass? Below the near-cap band
 *  (and an empty id) never spoils, which is what keeps a circulating zone untouched. `margin` defaults to the
 *  flat `SPOIL_MARGIN` (every existing caller byte-identical); the lean season widens it and plenty narrows
 *  it (BACKLOG-461), floored at 0 so a narrowed band spoils only at the very cap. */
export function spoilsAtCap(count: number, cap: number, margin: number = SPOIL_MARGIN): boolean {
  return count > 0 && count >= cap - Math.max(0, margin);
}

/**
 * Spoil one unit from every food id sitting at/near `cap`. Pure — returns a new pile, never mutates; returns
 * the **same** reference when nothing qualifies (a cheap no-op, twin of `bankFood`'s at-cap short-circuit)
 * so a caller can `if (next !== pile)` to know whether anything changed. Self-limiting: an id bleeds only
 * while it's in the near-cap band, so it settles at `cap - SPOIL_MARGIN - 1` and no lower.
 */
export function spoilFood(pile: FoodPile, cap: number = FOOD_STOCKPILE_CAP, margin: number = SPOIL_MARGIN): FoodPile {
  const spoiling = Object.keys(pile).filter((id) => spoilsAtCap(pile[id] ?? 0, cap, margin));
  if (spoiling.length === 0) return pile;
  const next: FoodPile = { ...pile };
  for (const id of spoiling) next[id] = (next[id] ?? 0) - 1;
  return next;
}

/**
 * Spoilage while you're away (BACKLOG-462) — the day-counted twin of the live per-day pass. The live spoilage
 * (455) rides an `onHour` day hook that never fires on a restore/away `clock.set`, so a hoard left through a long
 * absence used to survive untouched while the away catch-up (106) fast-forwarded everything else. This applies up
 * to `days` in-game days of the same `spoilFood` decay in one call. Deterministic (day-count in, no rolls) and
 * self-limiting: because `spoilFood` returns the same reference once nothing is in the near-cap band, the loop
 * breaks at the floor — so even a capped 7-day absence can never bleed a pile below `cap - margin - 1`, and the
 * break also bounds the work to at most `margin + 1` real passes.
 */
export function spoilFoodOverDays(
  pile: FoodPile,
  days: number,
  cap: number = FOOD_STOCKPILE_CAP,
  margin: number = SPOIL_MARGIN,
): FoodPile {
  if (days <= 0) return pile;
  let cur = pile;
  for (let i = 0; i < days; i++) {
    const next = spoilFood(cur, cap, margin);
    if (next === cur) break; // settled at the floor — further days are no-ops
    cur = next;
  }
  return cur;
}

/** The ticker line when a unit of `emoji` spoils out of a zone's stores (BACKLOG-455). No silent change
 *  (CHARTER §Quality bar). No leading article — two of three zone names carry their own ("The Grove"). */
export function spoiledLine(zoneName: string, emoji: string): string {
  return `🥀 ${zoneName}'s ${emoji} spoiled`;
}
