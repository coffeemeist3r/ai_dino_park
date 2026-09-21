/**
 * The watcher's record (BACKLOG-555) — what the save remembers about the observer *beyond* which
 * one it is.
 *
 * For a hundred and twenty-odd cycles the save has carried exactly one fact about the keeper:
 * `keeperId?: string`. That was the right scope for BACKLOG-155, which only had to remember the
 * pick, and it is the reason two queued keeper items had nowhere to land. BACKLOG-156 wants a
 * persona authored once and cached (CHARTER "Living minds") and had no field to cache it in;
 * BACKLOG-162 wants the bowl to notice the watcher *changing* and could not derive that from the
 * save at all, because a load looked identical whether you had worn one chassis for a month or
 * four in an hour.
 *
 * Pure TypeScript (no Phaser): Node-testable. The scene holds one of these, the save persists it
 * additively, and the plaque reads one line off it.
 */

import { DEFAULT_KEEPER_ID, type Keeper } from './keepers';

/** BACKLOG-156's slot. Shape-matches `SaveData.personas`' value so 156 needs no second migration. */
export interface KeeperPersona {
  text: string;
  source: string;
}

export interface KeeperRecord {
  /** The observer worn right now. Mirrors `SaveData.keeperId`, which stays for old readers. */
  id: string;
  /** The game day this observer was chosen — the plaque's and the streak's existing unit. */
  sinceDay: number;
  /** How many times the watcher has *changed*. Zero on a fresh save; a re-pick is not a change. */
  switches: number;
  /** The id worn immediately before this one. Absent until the first real switch. */
  previousId?: string;
  /** BACKLOG-156's cache. Shipped empty this cycle; nothing here authors it. */
  persona?: KeeperPersona;
}

/** A fresh record: this observer, chosen today, never switched. */
export function newRecord(id: string, day: number): KeeperRecord {
  return { id, sinceDay: day, switches: 0 };
}

/**
 * Wear a different observer. Bumps the count, files the outgoing id, and restarts the tenure.
 *
 * **The persona is deliberately dropped.** A cached persona belongs to the observer it was authored
 * for, not to the seat — carrying it across a switch would hand BACKLOG-156 a bug on its first
 * night, where picking Vix would show you Aki's authored self. Returns a new object; never mutates.
 */
export function switchTo(rec: KeeperRecord, id: string, day: number): KeeperRecord {
  return { id, sinceDay: day, switches: rec.switches + 1, previousId: rec.id };
}

/**
 * The additive load seed. A save carrying a record returns it untouched; a save carrying only the
 * old bare `keeperId` is seeded from that id; a save carrying neither is seeded from the default
 * observer. No throw and no migration step — which is the whole point of the item, since the
 * CHARTER's additive-save rule means an old save has to load, not be converted.
 */
export function recordFrom(
  saved: KeeperRecord | undefined,
  keeperId: string | undefined,
  day: number,
): KeeperRecord {
  return saved ?? newRecord(keeperId ?? DEFAULT_KEEPER_ID, day);
}

const ORDINAL_SUFFIX = ['th', 'st', 'nd', 'rd'];

/** 1st / 2nd / 3rd / 4th … Local and tiny on purpose — this is not worth a dependency. */
function ordinal(n: number): string {
  const rem100 = n % 100;
  const rem10 = n % 10;
  const suffix = rem100 >= 11 && rem100 <= 13 ? 'th' : (ORDINAL_SUFFIX[rem10] ?? 'th');
  return `${n}${suffix}`;
}

/**
 * The line the brass carries (BACKLOG-555's reachability half). Named `tenureLine` rather than
 * `watchLine` because `world/watch.ts` already owns that name for BACKLOG-524's zone-watching beat,
 * and two `watchLine`s in one scene is how a wrong import becomes a silent bug. A record nothing reads is
 * groundwork and CHARTER v7 calls groundwork a REWORK, so the record ships with one line a player
 * sees on a fresh save:
 *
 *   `AETHER-1 "Aki" · since day 1`
 *   `VANTA-9 "Vix" · since day 3 · 2nd watcher`
 *
 * The count is suppressed at zero because "1st watcher" on a brand-new park is noise, not news.
 */
export function tenureLine(rec: KeeperRecord, keeper: Keeper): string {
  const base = `${keeper.name} · since day ${rec.sinceDay}`;
  return rec.switches > 0 ? `${base} · ${ordinal(rec.switches + 1)} watcher` : base;
}
