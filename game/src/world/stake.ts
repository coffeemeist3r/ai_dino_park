/**
 * The founder's stake (BACKLOG-501's repair, drawn as 513/514) — where a ground's founding is a thing you
 * can walk up to instead of a line in a book you have to open.
 *
 * The Artist drew both states on the night of cycle 144, under the cycle-91 stash rule: a rig may be
 * authored ahead of the system that displays it. What the stash rule never came with is a deadline, so the
 * reachability register (501) went looking for rigs nobody had planted and found exactly these two. This is
 * the host they were waiting for.
 *
 * Two states, and between them they say the whole of what 512 and 516 record:
 * - **upright** — somebody founded this ground, and there are still people on it.
 * - **hollowed** — somebody founded it and everybody has gone. Canted, slack-bound, half-swallowed.
 * A ground nobody has ever founded shows **nothing**, which is the third reading and needs no rig: the
 * Saltpan is bare because bare is what unclaimed looks like.
 *
 * Pure: the tile and the key live here, `WorldScene` owns the sprite. No save field — the stake is derived
 * from the pioneer record and the head count, both of which already persist. `standings.ts`'s doctrine,
 * and the reason this repair is small enough to ride along with the item that found it.
 */

/**
 * The stake sits on the **same tile on every ground**, the `BANK_TILE` / `HATCH_TILE` discipline: the player
 * learns one place and can then find any ground's founding mark without hunting. Chosen clear of water on
 * all six grounds, clear of every fixture the park pins (the bank at 16,11, the hatch at 13,6, the bowl's
 * huddle tile and plot, the Grove's founding ruin), and off the map edges, where a step triggers a zone
 * handoff. `cycle-145-stake.test.ts` asserts all of that, so a later terrain pass that grows a pond over it
 * fails a test rather than sinking the mark.
 */
export const STAKE_TILE = { tileX: 6, tileY: 3 } as const;

/** The upright mark — this ground is somebody's (BACKLOG-513). */
export const STAKE_ART_KEY = 'founder_stake';

/** The same mark on ground everybody left (BACKLOG-514). */
export const STAKE_HOLLOWED_ART_KEY = 'founder_stake_hollowed';

/** The stand-in where a rig is missing — the per-item fallback 490/494/496/504/510 all ship. */
export const STAKE_GLYPH = '🪧';

/**
 * Which mark a ground shows, or `null` for one nobody has ever founded.
 *
 * `founded` is "does the pioneer record name anybody here", not "does anybody live here" — that is the
 * distinction 512 spent a cycle making, and this is the first thing on the ground that reads it.
 */
export function stakeArtKey(founded: boolean, hollowed: boolean): string | null {
  if (!founded) return null;
  return hollowed ? STAKE_HOLLOWED_ART_KEY : STAKE_ART_KEY;
}
