/**
 * The ritual's worn ground (BACKLOG-507) — the mark and its place, finally in the same place.
 *
 * Two halves of this have been in the repository for four cycles without ever meeting. BACKLOG-496 drew
 * the worn ground in cycle 138-art: `tic_pace`, a two-tile scuff, and `tic_circle`, a trodden ring, both
 * registered in `PROP_RIGS` and blitted by nothing. BACKLOG-421 has been persisting, per dino per ground,
 * the exact tile the mark wants — a `Haunt`, a place a dino returns to that walks one step every stretch
 * it performs there. A rig in a table and a tile in a save, and no grass anywhere in the park that ever
 * changed.
 *
 * So the mark goes on the haunt. Not on the *stretch*: worn grass does not un-wear when a dino walks off,
 * and 421's whole design is a place you keep coming back to. As the haunt drifts, the mark goes with it,
 * which is what turns four drifts into a visible little path rather than one static smudge.
 *
 * Pure TypeScript (no Phaser): the marks a ground should be showing are decided here and unit-tested;
 * `WorldScene` owns the sprites, on the same sprite-or-nothing lifecycle `syncBank` (504) uses. This
 * module knows the *key convention* and nothing about art — whether a key has a rig is `hasPropArt`'s
 * question, asked at the draw site, exactly as `pileArtKey` leaves that question to `syncBank`.
 *
 * `fuss` is deliberately undrawn (496 reserved it as the per-kind fallback control), and two of the five
 * personality axes map to it — so the graceful path is exercised on essentially every save rather than
 * being a branch nobody walks.
 */

import type { Haunts, TicKind } from './tic';

/** The `PROP_RIGS` key for a ritual's worn ground. A kind with no rig simply resolves to a key nothing
 *  bakes, and the draw site shows nothing — the same per-item fallback 490/494/496/502/506 all ship. */
export function wearKey(kind: TicKind): string {
  return `tic_${kind}`;
}

/** One worn patch: whose habit it is, where it sits, and the prop key it draws as. */
export interface WornMark {
  name: string;
  tileX: number;
  tileY: number;
  key: string;
}

/**
 * The marks a ground should be showing, from the haunts persisted on it.
 *
 * `kindOf` resolves a dino's *performed* ritual — the one it picked up off a friend (407) where it has
 * one, else its own signature. Going through the performed tic rather than the born one is the hazard
 * `ticFor`'s own doc comment names: the player must never be shown one ritual while the book reads
 * another. A `null` from the resolver drops the mark entirely, which is how a dino that has left the park
 * (or was never in it) leaves no ghost behind.
 *
 * Sorted by name so the draw order is a property of the cast and not of object-key order.
 */
export function marksOn(
  haunts: Haunts,
  zone: string,
  kindOf: (name: string) => TicKind | null,
): WornMark[] {
  const out: WornMark[] = [];
  for (const name of Object.keys(haunts).sort()) {
    const haunt = haunts[name]?.[zone];
    if (!haunt) continue;
    const kind = kindOf(name);
    if (!kind) continue;
    out.push({ name, tileX: haunt.tileX, tileY: haunt.tileY, key: wearKey(kind) });
  }
  return out;
}
