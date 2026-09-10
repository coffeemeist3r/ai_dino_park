/**
 * The sitting (BACKLOG-542) — the park's answer to *how long did you stay?*
 *
 * Cycle 155 taught the park **when** a session ends (`departure.ts`) and spent that knowledge entirely on
 * measuring the gap between sessions. Every keeper-facing number this park owns — `away`, `awaylog`,
 * `missed`, the streak, the return digest — is a fact about absence. A keeper who looks in for ninety
 * seconds and one who sits with the bowl for an hour are, to the park, the same keeper.
 *
 * This is the other half: the visit as a record with a start, an end, and a duration, kept the last three
 * deep the way the book keeps the last three returns.
 *
 * `SESSION_MIN_MS` deliberately lives in `departure.ts` and not here. It already means *long enough to
 * count as a sitting* over there, where a session's start is stamped; a second copy would be the defect
 * BACKLOG-483 was filed over and the one cycle 155 corrected one fire ago.
 *
 * Pure: no Phaser, no clock, no `Date.now()` — the caller owns every timestamp, exactly as `away.ts` and
 * `departure.ts` do.
 */

/** One sitting. Open while `endedAt` is absent. */
export interface SessionRecord {
  startedAt: number;
  endedAt?: number;
}

/** How many closed sittings the save keeps, newest first — the book's last-three-returns retention (153),
 *  reused rather than a fourth number invented. */
export const SESSIONS_KEPT = 3;

export function openSession(now: number): SessionRecord {
  return { startedAt: now };
}

/**
 * Close a sitting. **Idempotent by identity** — a closed record comes back as the same object, which is
 * what makes the ordinary alt-tab (a `blur` and then, a moment later, a `visibilitychange`) one ending
 * and not two. `departure.ts`'s `shouldStamp` guards the same double-fire one layer up; this guards it
 * again here, because a record that can be closed twice is a record whose duration depends on event order.
 */
export function closeSession(rec: SessionRecord, now: number): SessionRecord {
  return rec.endedAt !== undefined ? rec : { ...rec, endedAt: now };
}

/**
 * How long a sitting has run. A closed record measures to its end; an open one measures to `now`.
 *
 * Never negative. A wall clock that steps backwards — a manual change, a DST edge, an NTP correction —
 * reads as a sitting of zero rather than as a negative one, because every consumer of this number formats
 * it for a player.
 */
export function sessionMs(rec: SessionRecord, now?: number): number {
  const end = rec.endedAt ?? now ?? rec.startedAt;
  return Math.max(0, end - rec.startedAt);
}

/** Newest first, capped. */
export function pushSession(
  list: readonly SessionRecord[],
  rec: SessionRecord,
  keep = SESSIONS_KEPT,
): SessionRecord[] {
  return [rec, ...list].slice(0, Math.max(0, keep));
}

/**
 * The engraved duration: `40s`, `1m 40s`, `12m`, `1h 4m`.
 *
 * Whole units only, and the smaller unit is dropped when it is zero — the brass says `12m`, not `12m 0s`.
 * Imports nothing; it is arithmetic.
 */
export function sittingLine(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}
