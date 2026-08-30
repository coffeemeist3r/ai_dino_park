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

import type { FoundingKind } from './pioneer';

/**
 * The stake sits on the **same tile on every ground**, the `BANK_TILE` / `HATCH_TILE` discipline: the player
 * learns one place and can then find any ground's founding mark without hunting. Chosen clear of water on
 * all six grounds, clear of every fixture the park pins (the bank at 16,11, the hatch at 13,6, the bowl's
 * huddle tile and plot, the Grove's founding ruin), and off the map edges, where a step triggers a zone
 * handoff. `cycle-145-stake.test.ts` asserts all of that, so a later terrain pass that grows a pond over it
 * fails a test rather than sinking the mark.
 */
export const STAKE_TILE = { tileX: 6, tileY: 3 } as const;

/** The driven mark — somebody crossed in and claimed this ground (BACKLOG-513). */
export const STAKE_ART_KEY = 'founder_stake';

/** The set mark — this ground's founder woke up on it (BACKLOG-517). */
export const STAKE_NATIVE_ART_KEY = 'founder_stake_native';

/** The same mark on ground everybody left (BACKLOG-514). */
export const STAKE_HOLLOWED_ART_KEY = 'founder_stake_hollowed';

/** The stand-in where a rig is missing — the per-item fallback 490/494/496/504/510 all ship. */
export const STAKE_GLYPH = '🪧';

/**
 * Which mark a ground shows, or `null` for one nobody has ever founded.
 *
 * `kind` is 516's founding kind, or `null` where the pioneer record names nobody — "has anybody ever
 * founded here", not "does anybody live here", which is the distinction 512 spent a cycle making.
 *
 * Three states, and they are 516's two sentences plus the one the book cannot say. A ground somebody woke
 * up on stands a post **set** in laid stone with growth between it (517). A ground somebody walked into and
 * claimed stands the same post **driven** (513). A founded ground that has emptied leans it (514). Ground
 * nobody has ever claimed shows nothing, which needs no rig and is the truest of the four pictures.
 *
 * Hollowed wins over kind on purpose: a ground everybody left looks the same whether they were born there
 * or walked in. That is what leaving does.
 */
export function stakeArtKey(kind: FoundingKind | null, hollowed: boolean): string | null {
  if (!kind) return null;
  if (hollowed) return STAKE_HOLLOWED_ART_KEY;
  return kind === 'born' ? STAKE_NATIVE_ART_KEY : STAKE_ART_KEY;
}
