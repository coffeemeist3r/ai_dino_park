/**
 * The homecoming streak (BACKLOG-122) — the first thing this park counts that happens in the *player's*
 * life rather than in the bowl's.
 *
 * Every other read Milestone 18 shipped measures the keeper's absence in the park's own units: the digest's
 * span, the missed-you grades, the drift between a pair, all of them functions of in-game minutes. This one
 * is a wall-clock calendar count, and the distinction is not pedantry — `away.ts`'s `fmtSpan` divides by an
 * in-game day, so borrowing it here would print a real week as seven hours. Nothing in this module imports
 * from `away.ts`, deliberately.
 *
 * The day comes from `keeperclock.ts`. That module was written at cycle 152 with `keeperDay()` built out of
 * the *local* getters and never `toISOString`, and its comment names this item as the reason: for a player
 * east or west of UTC, the ISO form calls a weekday evening "tomorrow" or "yesterday" and hands the streak
 * the wrong day. So there is exactly one place in this park that decides what day it is, and this is a
 * consumer of it rather than a second opinion.
 *
 * Pure: no `Date.now()`, no Phaser. The caller supplies today's day string.
 */

import { keeperDay } from './keeperclock';

/** The keeper's attendance, as the save keeps it. */
export interface Streak {
  /** The last day the keeper opened the park, `YYYY-MM-DD` local — or null before the first visit. */
  last: string | null;
  /** Consecutive days including `last`. 1 on a first (or resumed-after-a-gap) visit. */
  run: number;
  /** The longest run this save has ever reached. Never falls. */
  best: number;
}

export const NO_STREAK: Streak = { last: null, run: 0, best: 0 };

/**
 * The calendar day after `day`, in the keeper's own zone.
 *
 * Built by walking 24 hours forward from `day`'s *local* midnight and asking `keeperDay` to name where that
 * landed. Two things this deliberately is not:
 *
 * - **not `Date.parse('2026-09-08')`**, which the language specifies as UTC — the same bug `keeperDay`
 *   exists to avoid, reintroduced one function later.
 * - **not string arithmetic on the components**, which would need a month-length table and a leap rule that
 *   `Date` already has.
 *
 * DST is handled by not being special-cased. A local day is 23, 24 or 25 hours long; adding 24 hours to its
 * midnight lands somewhere strictly inside the following local day in all three cases (an hour past midnight
 * on a long day, an hour before midnight on a short one), and `keeperDay` names the day rather than the
 * hour. So the adjacency answer is right on the two mornings a year when a naive `+1 day` is wrong.
 */
function nextDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const midnight = new Date(y, m - 1, d);
  return keeperDay(midnight.getTime() + 24 * 60 * 60 * 1000);
}

/**
 * Record that the keeper opened the park on `today`.
 *
 * Returns the **same reference** when the day is unchanged — a keeper who reloads the page eight times in an
 * afternoon has visited once, and the identity lets the caller skip the write, the `runUpkeep` / `spoilFood`
 * no-op contract this codebase already uses.
 */
export function noteDay(prev: Streak, today: string): Streak {
  if (prev.last === today) return prev;
  const run = prev.last !== null && nextDay(prev.last) === today ? prev.run + 1 : 1;
  return { last: today, run, best: Math.max(prev.best, run) };
}

/**
 * The plaque's line about the keeper.
 *
 * Three registers rather than a number with a unit, because "1 days running" is how a stat board tells you
 * nobody wrote the copy. A streak that has never been recorded says nothing at all, which is the only state
 * a save written before this cycle can be in.
 */
export function streakLine(s: Streak): string {
  if (s.run <= 0) return '';
  const head = s.run === 1 ? 'first day' : `${s.run} days running`;
  return s.best > s.run ? `${head} · best ${s.best}` : head;
}
