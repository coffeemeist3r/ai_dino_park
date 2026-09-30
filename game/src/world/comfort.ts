/**
 * Comforting nuzzle (BACKLOG-130) — "there there".
 *
 * Pure (no Phaser, no WebLLM): the dino-to-dino half of the attention economy.
 * When the homecoming makes a near-tied runner-up sulk (`homecoming.ts` →
 * `jealous`), this picks the sulker's *closest friend* — the dino with the
 * strongest pairwise bond (BACKLOG-013) — to cross the bowl and console it.
 * The bond between them deepens a little; consolation is itself a friendship
 * beat. A poorly-integrated dino with no real friend (every bond below the
 * floor) gets no one — which is its own kind of telling.
 *
 * Gratitude echo (BACKLOG-132): a consoled dino files *who* came for it. When
 * that comforter later sulks, the dino it once consoled crosses over first —
 * even past a stronger-bond peer, even below the floor. Reciprocity, not just
 * proximity: the bond graph bending back the other way.
 */

import { bondPoints, type Bonds } from '../social/bonds';

/** A friend must be at least this close (pairwise bond) to bother crossing — one huddle's worth. */
export const COMFORT_BOND_FLOOR = 8;

/** How much the comforter↔sulker bond grows from the consolation — small; the gesture is the point. */
export const COMFORT_BOND = 2;

/** Who each dino owes a consolation back to: `consoled → comforters who came for it` (BACKLOG-132). */
export type Gratitude = Record<string, string[]>;

/**
 * File that `byWhom` consoled `consoled`. Immutable + deduped: returns a new
 * ledger, never mutates input, and recording the same pair twice is a no-op.
 */
export function recordGratitude(g: Gratitude, consoled: string, byWhom: string): Gratitude {
  const owed = g[consoled] ?? [];
  if (owed.includes(byWhom)) return g;
  return { ...g, [consoled]: [...owed, byWhom] };
}

/**
 * Who crosses the bowl to console `sulker`.
 *
 * Reciprocity first (BACKLOG-132): if any present peer was previously consoled
 * *by* this sulker — i.e. that peer owes it (`gratitude[peer]` includes the
 * sulker) — the grateful debtor comes, picked by highest pairwise bond
 * (lexicographic tie-break) and **ignoring the floor**. You show up for the
 * friend who showed up for you.
 *
 * Otherwise (BACKLOG-130): the sulker's closest friend among `names` — highest
 * pairwise bond, provided it clears `COMFORT_BOND_FLOOR`. Ties break to the
 * lexicographically-smallest name (matching `homecoming.ts` `topBy`). Returns
 * null when no peer is close enough to come over. `floor` defaults to the old
 * loner-floor bar; the hatch sulk passes the book's `CLOSE_BOND` (BACKLOG-136).
 */
export function comforter(
  sulker: string,
  bonds: Bonds,
  names: string[],
  gratitude?: Gratitude,
  floor: number = COMFORT_BOND_FLOOR,
): string | null {
  // Reciprocity override: a present debtor of the sulker comes first, floor or no floor.
  let debtor: { name: string; bond: number } | null = null;
  for (const name of names) {
    if (name === sulker) continue;
    if (!gratitude?.[name]?.includes(sulker)) continue;
    const bond = bondPoints(bonds, sulker, name);
    if (!debtor || bond > debtor.bond || (bond === debtor.bond && name < debtor.name)) {
      debtor = { name, bond };
    }
  }
  if (debtor) return debtor.name;

  let best: { name: string; bond: number } | null = null;
  for (const name of names) {
    if (name === sulker) continue;
    const bond = bondPoints(bonds, sulker, name);
    if (!best || bond > best.bond || (bond === best.bond && name < best.name)) {
      best = { name, bond };
    }
  }
  return best && best.bond >= floor ? best.name : null;
}

/** The floating consolation line over the comforter (contains both names + 🫂). */
export function comfortLine(friend: string, sulker: string): string {
  return `${friend}: There there, ${sulker}. 🫂`;
}

/** The memory the comforted dino keeps; WorldScene folds this into the store. */
export function comfortMemory(friend: string): string {
  return `${friend} came over to comfort me`;
}

// ── Comfort is for friends (BACKLOG-136) ──────────────────────────────────────────────────────────
//
// The sulk a player causes in the first minute — the dino that lost the scramble at the hatch — had
// nobody come for it at all. Now a *close* friend on the same ground walks over and talks it round,
// and a dino whose best bond is only friendly stands there alone while the ticker names who did not come.

/**
 * How many world steps the friend has to reach the sore dino before it gives up — enough to cross the
 * widest ground, and still inside the funk's own twenty-step window so the friend can beat the shrug.
 */
export const CONSOLE_STEPS = 16;

/** The one-shot mark popped over the friend as it arrives (BACKLOG-572 draws it). */
export const COMFORT_ART_KEY = 'comfort';
export const COMFORT_GLYPH = '🫂';

export function headingOverLine(friend: string, loser: string): string {
  return `🫂 ${friend} is heading over to ${loser}`;
}

export function talkedRoundLine(friend: string, loser: string): string {
  return `🫂 ${friend} talked ${loser} round after the hatch`;
}

/** Who did not come: the sore dino's closest on its ground, or nobody at all. */
export function unconsoledLine(loser: string, closest: string | null): string {
  return closest
    ? `🫥 nobody came for ${loser} — ${closest} isn't close enough`
    : `🫥 nobody came for ${loser} — nobody here knows it`;
}
