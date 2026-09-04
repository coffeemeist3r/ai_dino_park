/**
 * KeeperClock (BACKLOG-529) — the *keeper's* local reading of the real clock.
 *
 * `WorldClock` owns the park's time. This owns the player's, and the two are not the same kind of thing.
 * The park's clock converts real milliseconds into an in-game rate; every other real timestamp in the park
 * (`savedAt`, the cooldowns) is a **duration**, which is timezone-free and needs none of this. An
 * **hour-of-day** is different: it is local, it moves under DST, and it is the one clock reading a player
 * can legitimately be in two of at once. Cycle 149's vigil made it load-bearing world state and reached it
 * through a bare `new Date().getHours()` at two call sites; this is the seam that reading goes through, so
 * the answers below are written once instead of per caller.
 *
 * Pure apart from the default now-source, which is injectable exactly as `WorldClock`'s is — so a spec can
 * put the keeper at an hour instead of hoping CI runs at a convenient one.
 *
 * ## The three answers
 *
 * **DST fall-back.** The same local hour happens twice. The park records both, and that is deliberate: the
 * visit history is a record of hours *as the keeper lived them*, and the keeper really did open the park
 * twice at 01:xx. De-duplicating would be the park telling the player they were not where they were.
 *
 * **DST spring-forward.** An hour does not happen. A keeper whose habit is the skipped hour simply does not
 * visit that day; nothing is recorded, the history is unchanged, and the gap is out-voted by the keeper's
 * next few visits (`VISIT_HISTORY_MAX`). There is no special case, and there should not be one.
 *
 * **A timezone change.** The history is hours-as-lived, so a keeper who flies somewhere looks to the park
 * like a keeper whose habits changed — and is believed within `VISIT_HISTORY_MAX` visits, by the same
 * mechanism that believes a genuinely changed habit. The alternative was to pin the save's original zone
 * and translate into it; it was rejected because a keeper who moves house is a keeper whose hour changed,
 * and the park anticipating them at their old country's breakfast time is a bug wearing a rationale.
 */

/** The now-source. Injectable so this is testable in Node — the one place `Date.now()` is read for an hour. */
let nowSource: () => number = () => Date.now();

/** The keeper's local hour, 0..23. */
export function keeperHour(nowMs: number): number {
  return new Date(nowMs).getHours();
}

/**
 * The keeper's local calendar day, `YYYY-MM-DD`.
 *
 * Built from the local getters and never from `toISOString`, which is UTC: for a player east or west of it
 * that would call a weekday evening "tomorrow" or "yesterday" and hand BACKLOG-122's streak the wrong day.
 * No consumer yet — 122 is the next arc, and a day-of-the-player's-life is precisely the reading that must
 * not be re-derived at each call site, which is the whole finding this item was filed on.
 */
export function keeperDay(nowMs: number): string {
  const d = new Date(nowMs);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export interface KeeperClock {
  /** epoch ms from the current source. */
  now(): number;
  /** the keeper's local hour right now. */
  hour(): number;
  /** the keeper's local calendar day right now. */
  day(): string;
}

const instance: KeeperClock = {
  now: () => nowSource(),
  hour: () => keeperHour(nowSource()),
  day: () => keeperDay(nowSource()),
};

export function getKeeperClock(): KeeperClock {
  return instance;
}

/** Point the keeper's clock at a different now — specs and the `__keeperNow` dev hook. */
export function setKeeperNowSource(fn: () => number): void {
  nowSource = fn;
}

/** Back to the wall clock. Test use, and the hook's reset path. */
export function resetKeeperClock(): void {
  nowSource = () => Date.now();
}
