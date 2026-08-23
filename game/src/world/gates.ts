/**
 * The gate that was written for one door (BACKLOG-489).
 *
 * Cycle 133 shipped a bill that leans a ground's work call when its walls are coming down (485). Every hook
 * was correct and it posted nothing, because the gate it had to pass through was keyed by **ground** and
 * therefore could not tell "this ground has never spoken" from "this *cause* has never spoken". 481's rule —
 * a ground's opening seating is not a turnover, so record it silently — is sound for the council. Applied to
 * an ordinal rather than to a cause, it silences whatever authority happens to speak second, and it does so
 * most reliably on the grounds the second authority exists to cover: a ruined ground with no council at all.
 *
 * 485 was repaired at its own call site with `!seeding || lean === call`. That is a bug fixed; this is the
 * pattern. A gate that knows *who* is speaking can keep 481's rule exactly, and still let a new voice be
 * heard the first time it says anything.
 *
 * Deliberately scoped. 489's own text names four gates; on inspection only two exist in this shape (481's
 * work call and 487's spend call). The once-a-day discontent (471) already fires on its first record, the
 * gratitude fade (251) is a ring-position window and not a gate of this kind, and the one-visit-per-sorrow
 * (226) has never been built — `sympathyVisit` in `cold.ts` carries a `ponytail:` note saying so. A seam is
 * worth having for two call sites; inventing ports for two gates that do not exist is not.
 *
 * Pure TypeScript: no Phaser, no WebLLM, no scene state. The caller owns the log and does the announcing.
 */

/**
 * A source that can decide a thing. `seedsSilently` is 481's rule, restated as a property of the *speaker*:
 * a council's opening seating is not a turnover and is recorded without a word, where a bill has no such
 * founding moment — a ground's walls coming down is news the first time it happens.
 */
export interface Cause {
  readonly id: string;
  readonly seedsSilently: boolean;
}

/** key → cause id → the last value that cause recorded under that key. */
export type CauseLog<T> = Record<string, Record<string, T>>;

/**
 * Record a call and say whether it is worth announcing. Three rules, in order:
 *
 * 1. This cause already said this — nothing. Only a *change* is news (481's rule, kept).
 * 2. Nothing at all has been recorded under this key and the cause seeds silently — record, say nothing.
 *    (The opening seating, kept — but now conditional on *who* is opening, not on being first.)
 * 3. Otherwise announce. Including, and this is the whole item, a cause that has never spoken on a key some
 *    *other* cause has already spoken on.
 *
 * Pure: returns the next log rather than mutating the one it is given, so a caller can decide on a snapshot.
 */
export function recordCall<T>(
  log: CauseLog<T>,
  key: string,
  cause: Cause,
  value: T,
): { log: CauseLog<T>; announce: boolean } {
  const byCause = log[key];
  if (byCause && byCause[cause.id] === value) return { log, announce: false };
  const virgin = byCause === undefined || Object.keys(byCause).length === 0;
  const announce = !(virgin && cause.seedsSilently);
  return { log: { ...log, [key]: { ...(byCause ?? {}), [cause.id]: value } }, announce };
}

/** The elected voice. Its first word on a ground is a seating, not a turnover (481). */
export const COUNCIL_CAUSE: Cause = { id: 'council', seedsSilently: true };

/** The ground itself, speaking through its disrepair (485). It has no opening seating to be silent about. */
export const BILL_CAUSE: Cause = { id: 'bill', seedsSilently: false };
