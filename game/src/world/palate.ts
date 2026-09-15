/**
 * Acquired taste (BACKLOG-068) — a palate is a habit, not a fact.
 *
 * Since cycle 25 a dino's taste has been a **constant the keeper slowly discovers**. `favoriteFood`
 * reads it straight off the personality, 070 lets a prickly dino refuse anything else, 069 fills the
 * book in as the keeper watches it swallow. Every one of those is the keeper learning about the dino.
 * Nothing the keeper *did* — a hundred meals of the same greens — had ever changed a single thing
 * about what that dino wanted.
 *
 * Now it does: eat the same non-favorite `WARM_AT` times and you have come round to it.
 *
 * **Why this is not the 069 record.** `tasted` (menu.ts) is a set of what the *keeper has learned*, and
 * it is written from three sites — the hatch meal, the stores feed, and **LUMEN-3's scan**. The scan is
 * a read, not a dinner. A Scholar pressing `B` three times must not warm a dino to anything, so the
 * count that warms lives here and is written only from the two sites where food goes down a throat.
 *
 * Pure (no Phaser): Node-testable. WorldScene owns the record, the two write sites, and the save.
 */

import { FOODS } from './foods';

/** Meals of the same food before a dino has come round to it. Three, and the founding satchel ships
 *  four greens — so a keeper warms a dino with the stock a fresh save hands them (CHARTER v7). */
export const WARM_AT = 3;

/** dino name → food id → meals eaten, counted only to `WARM_AT`. Lifetime; nothing clears it. */
export type PalateRecord = Readonly<Record<string, Readonly<Record<string, number>>>>;

export function mealCount(rec: PalateRecord, name: string, foodId: string): number {
  return rec[name]?.[foodId] ?? 0;
}

export function isWarm(rec: PalateRecord, name: string, foodId: string): boolean {
  return mealCount(rec, name, foodId) >= WARM_AT;
}

/**
 * Count one meal of `foodId` for `name`.
 *
 * Returns the **same object** once the count has reached `WARM_AT` — the identity contract `noteTaste`
 * already runs, and for the same reason: the stores-feed site sits inside the needs tick and saves on
 * every feed, so a record that reallocated on every meal forever would turn a settled palate into
 * permanent save churn. Counting stops where the meaning stops.
 */
export function noteMeal(rec: PalateRecord, name: string, foodId: string): PalateRecord {
  const at = mealCount(rec, name, foodId);
  if (at >= WARM_AT) return rec;
  return { ...rec, [name]: { ...(rec[name] ?? {}), [foodId]: at + 1 } };
}

/**
 * Was *this* meal the one that crossed the line?
 *
 * One place decides "this meal was the beat", so the scene's 😌 and its event-log line can never drift
 * out of step with the rule — the failure BACKLOG-483 keeps filing about, answered before it happens.
 */
export function justWarmed(before: PalateRecord, after: PalateRecord, name: string, foodId: string): boolean {
  return !isWarm(before, name, foodId) && isWarm(after, name, foodId);
}

/**
 * The foods this dino has come round to, in `FOODS` order, minus whatever is currently its favorite.
 *
 * The favorite is excluded rather than the record filtered, because the favorite is season-aware and
 * answered fresh on every read (069's rule): a food warmed in spring that becomes the favorite in
 * summer reads `loves` all summer and goes back to `warmed to` in the fall. One food, one clause,
 * never both at once.
 */
export function warmedTo(rec: PalateRecord, name: string, exceptFoodId?: string): string[] {
  return FOODS.filter((f) => f.id !== exceptFoodId && isWarm(rec, name, f.id)).map((f) => f.id);
}

/** What the dino files the day it comes round. A builder, per BACKLOG-483: reader written with writer. */
export function warmedMemory(label: string): string {
  return `you have come round to the ${label} — it isn't so bad after all`;
}

/** The ticker line for the same moment. */
export function warmedLine(name: string, label: string): string {
  return `😌 ${name} has come round to the ${label}`;
}
