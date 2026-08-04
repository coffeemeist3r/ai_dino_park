/**
 * The say changes hands (BACKLOG-467) — the governance turnover beat. A zone's spend priority (463) already
 * re-sets whenever its provider (448) changes: `spendPriorityFor` recomputes off the incoming provider's
 * temperament on every read. But that re-set is *silent* — nothing marks the moment the say passes from one
 * dino to another. This gives the turnover a one-off logged beat, so *who holds the say, and when it turns
 * over,* is legible on the keeper's ticker instead of buried in the store.
 *
 * Pure TypeScript (no Phaser, no roles store): the providers and the priority are passed in, so the whole
 * decision runs in Node for tests. WorldScene owns the per-zone tracking (`lastProviderByZone`) and the
 * ticker; this module owns only the wording and the "is it a genuine handover" rule.
 */

import type { SpendPriority, WorkPriority } from './governance';

/** The 🧺 mark the beat leads with — the same glyph the `provider` role wears (roles.ts ROLE_ICON). */
export const HANDOVER_MARK = '🧺';

/**
 * The governance colour of the beat's tail, read off the incoming provider's spend priority (463): a
 * `'feed'` ground puts mouths before walls, a `'bank'` ground puts walls before mouths. This is the same
 * feed-vs-bank stance the two 463 hooks read, said in a phrase the player can catch on the ticker.
 */
export function priorityPhrase(priority: SpendPriority): string {
  return priority === 'feed' ? 'mouths before walls' : 'walls before mouths';
}

/**
 * The second call's phrase (BACKLOG-473) — what the incoming provider puts its ground's backs into. Twin of
 * `priorityPhrase`; the handover names both calls now that a ground decides more than one thing.
 */
export function workPhrase(work: WorkPriority): string {
  return work === 'gather' ? 'backs to the stores' : 'backs to the walls';
}

/**
 * The handover beat, or `null` when nothing changed hands. Fires when there's a genuine change to a *new,
 * non-null* provider — which covers both the first provider a young zone ever crowns (`prev` null) and a
 * true turnover (one dino out-banking the incumbent). It deliberately does NOT fire when:
 * - the provider is unchanged (`next === prev`) — a standing provider isn't news every step, and
 * - the provider departs and the zone is left with none (`next` null) — 463's policy lingers on the store
 *   and the say simply falls vacant; no new dino has taken it, so there's no handover to announce.
 */
export function handoverBeat(
  prev: string | null,
  next: string | null,
  zoneName: string,
  priority: SpendPriority,
  // BACKLOG-473: optional so every pre-473 4-arg call (and its shipped spec) reads exactly as before.
  work?: WorkPriority,
): string | null {
  if (!next || next === prev) return null;
  const tail = work ? `${priorityPhrase(priority)} · ${workPhrase(work)}` : priorityPhrase(priority);
  return `${HANDOVER_MARK} ${next} sets ${zoneName}'s table now — ${tail}`;
}
