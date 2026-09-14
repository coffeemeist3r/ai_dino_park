/**
 * The menu in the book (BACKLOG-069) — what the keeper has *learned* about a dino's palate.
 *
 * Every dino in this bowl has had a favorite food since cycle 25, and until this cycle the only routes
 * a player had to it were to be looking at that dino during the single frame its 😋 is on screen, or to
 * be playing LUMEN-3 and press the scan. `favoriteFood` drives the rush range, the bond a meal is worth,
 * the solace beat, the granary's spend priority and the keeper's scan panel — and the book, whose whole
 * job is "what I have learned about this dino", never carried it.
 *
 * So it carries it the Pokemon way: blank until earned. The record is what a dino has actually *eaten*,
 * never what it was offered — a refusal (070) teaches the keeper nothing about what a dino likes.
 *
 * Pure (no Phaser): Node-testable. The scene owns the record and the three moments that write to it;
 * this module owns the shape and the words.
 */

import { FOODS, type Food } from './foods';

/** dino name → the food ids it has eaten, in no particular order. Lifetime; nothing clears it. */
export type TastedRecord = Readonly<Record<string, readonly string[]>>;

export const MENU_GLYPH = '🍽';

/** An undiscovered slot. One cell per food, so the line's *length* is the size of the sub-goal. */
export const MENU_BLANK = '·';

/** The clause that stands in for a favorite the keeper has not found yet. */
export const FAVORITE_UNKNOWN = '(favorite unknown)';

export function hasTasted(rec: TastedRecord, name: string, foodId: string): boolean {
  return (rec[name] ?? []).includes(foodId);
}

/**
 * Record that `name` has eaten `foodId`.
 *
 * Returns the **same object** when the pair is already known, and the scene leans on that identity: the
 * stores-feed site (444) runs inside the needs tick and saves on every feed, so a record that
 * reallocated on every repeat meal would turn a cheap no-op into save churn.
 */
export function noteTaste(rec: TastedRecord, name: string, foodId: string): TastedRecord {
  if (hasTasted(rec, name, foodId)) return rec;
  return { ...rec, [name]: [...(rec[name] ?? []), foodId] };
}

/**
 * The book's menu line for one dino: one cell per food in `FOODS` order, then the favorite — named only
 * once this dino has actually eaten it.
 *
 * `favorite` is passed in rather than derived, because the favorite is **season-aware**
 * (`favoriteFood(traits, season)`) and the caller is the only one that knows what month it is. The
 * record stores the food that was eaten; which of those foods is the favorite is answered fresh on
 * every open.
 */
export function menuLine(tasted: readonly string[], favorite: Food): string {
  const cells = FOODS.map((f) => (tasted.includes(f.id) ? f.emoji : MENU_BLANK)).join('');
  const found = tasted.includes(favorite.id);
  const tail = found ? `loves ${favorite.emoji} ${favorite.label}` : FAVORITE_UNKNOWN;
  return `${MENU_GLYPH} menu: ${cells}  ${tail}`;
}
