/**
 * The departure seam (BACKLOG-541) — the park's answer to *when did the keeper leave?*
 *
 * The park owns four modules about the keeper coming back — `arrival.ts`, `homecoming.ts`,
 * `away.ts`, `awaylog.ts` — and, until this cycle, nothing at all about the keeper going. The
 * cost of that gap was not cosmetic. `savedAt` is stamped by `currentSaveData()` at whichever
 * of the twenty-odd scattered `void this.saveGame()` calls fired last, and every one of those
 * fires on an *interaction*: a greet, a feed, a gift, a mend. So `savedAt` recorded **when the
 * keeper last did something**, not when the keeper left, and the catch-up on return measured
 * the absence from there.
 *
 * The consequence, in the units the player lives in: `AWAY_SCALE` is 1, so an in-game minute
 * away is a real minute, and `MISSED_MIN_MINUTES` is 5. Watch the bowl for six minutes without
 * touching it, step away for one, and the park computed a seven-minute absence — filed
 * missed-you traces, drifted a pair apart, and printed a digest line about a gap that did not
 * happen. Milestone 18's whole subject, measured from the wrong moment. The park was counting
 * the time you spent watching it as time you spent away from it.
 *
 * ## Why two stages and not one
 *
 * Leaving is not one event, and the difference between its two halves is the difference
 * between a feature a player can see and one they cannot:
 *
 * - **`leaving`** — focus lost, still visible. Alt-tab, click another window. The canvas is
 *   still painting, so this is the only stage at which the park can *show* the player
 *   anything on the way out. BACKLOG-119's goodbye glance fires here.
 * - **`gone`** — `document.hidden` / `pagehide`. Nobody is looking. State may be recorded;
 *   nothing may be drawn.
 *
 * BACKLOG-119's own text has named the hidden event as its trigger since cycle 30, which is
 * precisely the moment at which nothing drawn can be seen. The split above is what makes that
 * item shippable rather than decorative, which is why it is a real fact about the world and
 * not over-design.
 *
 * Pure: two booleans in, a stage out. No Phaser, no clock, no `Date.now()` — the caller owns
 * the timestamps, exactly as `away.ts` owns its own.
 */

/** Where the keeper is, from the park's point of view. */
export type DepartureStage = 'here' | 'leaving' | 'gone';

export interface DepartureFacts {
  /** does the document have focus right now (`document.hasFocus()`)? */
  focused: boolean;
  /** is the document hidden right now (`document.hidden`)? */
  hidden: boolean;
}

/**
 * How long a session must have run before leaving it counts as a goodbye.
 *
 * Lives here rather than in `parting.ts` because both tracks read it — the stamp and the
 * glance must never disagree about whether the keeper was actually here — and a constant
 * written down twice is the defect BACKLOG-483 was filed over.
 *
 * Twenty seconds: long enough that the blur a player fires while alt-tabbing *into* the park
 * at boot is not a farewell, short enough to clear well inside the ten minutes CHARTER v7's
 * bar measures a fresh save over.
 */
export const SESSION_MIN_MS = 20_000;

/**
 * `hidden` wins outright. A backgrounded tab is gone whether or not the OS still calls its
 * window focused — some platforms keep focus on a minimised window — and the stage is about
 * what the player can see, not about what the window manager thinks.
 */
export function departureStage(f: DepartureFacts): DepartureStage {
  if (f.hidden) return 'gone';
  return f.focused ? 'here' : 'leaving';
}

/**
 * Should this transition stamp the save?
 *
 * Only the **first** step out of `here`. That single clause is the whole "once per departure,
 * not once per event" rule: the ordinary alt-tab fires `blur` and then, a moment later,
 * `visibilitychange`, so `leaving → gone` must not re-stamp — and it does not, because its
 * `prev` is no longer `here`. Any return is `* → here`, which is an arrival and not this
 * module's business.
 */
export function shouldStamp(prev: DepartureStage, next: DepartureStage): boolean {
  return prev === 'here' && next !== 'here';
}
