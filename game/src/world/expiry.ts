/**
 * The state that ends (BACKLOG-544) — one seam for the funks a dino enters and leaves.
 *
 * Four transient states had grown in this park, each with its own answer to the same two questions.
 * `pendingRepair` was a single field plus a single step stamp; `stungAt` a name→step map read through
 * `stingIsFresh`; `coldPending` a `Set` with no clock at all; `liftedUntil` a map of wall-clock
 * milliseconds. Entering was four different writes and leaving was four different rules, which is why
 * BACKLOG-123 had to be filed as a feature — "the sulk never ends" was indistinguishable from "the sulk
 * was never given an ending", because nothing in the park said what an ending is.
 *
 * This says it: a funk is *a kind, and the step it began at*. Whether it has ended is the kind's window,
 * and how it ended is which of the two doors the caller came through — the keeper's, or the clock's.
 *
 * Deliberately **two callers, not four**. The cold funk and the mood lift stay where they are until a
 * cycle has a reason to touch them; a seam that migrates everything the day it is born is a shape nobody
 * chose. Two callers is what makes this a rule rather than a special case with a module around it.
 *
 * Pure: no Phaser, no clock, no `Date.now()`. The caller owns the step counter, exactly as `sulk.ts` and
 * `tic.ts` do. Immutable record in, immutable record out — the `memory.ts` / `bonds.ts` idiom.
 */

import { SULK_FADES_AFTER_STEPS } from './sulk';

/**
 * The two funks on the seam this cycle.
 *
 * `sulk` is BACKLOG-123's: the near-tied runner-up slighted when the keeper comes home to somebody else.
 * `shoulder` is new — the dino that comes away from a contested drop with nothing (it slunk off from a
 * winner that wouldn't budge, or it was the winner that ceded to a gobbler). Both wear the same 😒,
 * because from the player's side they are the same feeling arriving by different doors.
 */
export type FunkKind = 'sulk' | 'shoulder';

export interface Funk {
  kind: FunkKind;
  /** The world step the funk began at. A step, never a timestamp — see the module note. */
  since: number;
}

/** Who is in a funk, by name. One funk per dino: a fresher feeling replaces a staler one. */
export type Funks = Readonly<Record<string, Funk>>;

/**
 * How many ambient steps each kind runs unattended.
 *
 * `sulk` is **imported**, not restated: BACKLOG-123 reasoned its way to forty steps (two minutes — long
 * enough that crossing the bowl to make it right is a race the keeper wins) and that reasoning lives in
 * `sulk.ts` beside the number. A seam that re-typed the constant would be free to drift from it.
 *
 * `shoulder` is twenty steps — sixty seconds. A scrap at the hatch is a lighter thing than being passed
 * over at homecoming, so it is the shorter of the two; it is also longer than `STING_FADES_AFTER_STEPS`'s
 * private smart, because this one is the part the player can see and a mood you cannot catch is not a mood.
 */
export const FUNK_WINDOW: Readonly<Record<FunkKind, number>> = {
  sulk: SULK_FADES_AFTER_STEPS,
  shoulder: 20,
};

/** Enter a funk (or restart one — a fresh slight re-anchors the clock rather than inheriting an old one). */
export function enterFunk(funks: Funks, name: string, kind: FunkKind, atStep: number): Funks {
  return { ...funks, [name]: { kind, since: atStep } };
}

/** Leave a funk. A name that isn't in one is a no-op, so callers never have to check first. */
export function clearFunk(funks: Funks, name: string): Funks {
  if (!(name in funks)) return funks;
  const next = { ...funks };
  delete next[name];
  return next;
}

export function funkOf(funks: Funks, name: string): Funk | undefined {
  return funks[name];
}

/** Is this dino in any funk? The idle glyph's read — it shades to 😒 for either kind. */
export function inFunk(funks: Funks, name: string): boolean {
  return name in funks;
}

/**
 * Which funks have run their window out by `atStep` — the clock's door, as opposed to the keeper's.
 *
 * Sorted by name so two funks ending on the same step resolve in a fixed order; the park is small enough
 * that the cost is nothing and a nondeterministic ticker line is a flake waiting for a cycle to blame.
 */
export function expiredFunks(funks: Funks, atStep: number): { name: string; kind: FunkKind }[] {
  return Object.entries(funks)
    .filter(([, f]) => atStep - f.since >= FUNK_WINDOW[f.kind])
    .map(([name, f]) => ({ name, kind: f.kind }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
