/**
 * Brought to the hatch (BACKLOG-381) — the park's *social* answer to hunger.
 *
 * 444 taught the bowl to feed a starving dino out of its own stores: a number crossed a bar and food
 * appeared. This is the same sentence with a face on it. When the keeper drops food, the cast converges
 * on it — except the dino withdrawn at the wall (135), which misses the meal precisely because it has
 * nobody. So somebody goes and gets it: one dino turns around, walks *away* from the food to the edge,
 * nudges the loner, and walks it back in. Comfort (130) that leads instead of consoling in place.
 *
 * **The floor is the whole design.** A loner is a dino whose *every* bond is below `LONER_FLOOR` — so
 * "its closest friend above the comfort floor" (the 130 pick) is null by construction and nobody could
 * ever come. `FETCH_BOND_FLOOR` therefore sits strictly *below* `LONER_FLOOR`: the dino that comes for a
 * loner is not a close friend — a loner has none — it is the closest thing this dino has to one. If not
 * even that exists, nobody comes and it stands at the edge while the park eats. That silence is the read
 * the beat is for. (`fetch.test.ts` pins the floor relation so a tuning pass can't quietly close it.)
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable. WorldScene owns the escort state, the two-phase
 * walk, and the beat; who comes is `closestFriend()`'s call, reused from the bond graph.
 */

import { closestFriend, type Bonds } from '../social/bonds';

/**
 * How close a peer must be to bother crossing the bowl for a withdrawn loner — half a huddle, and
 * deliberately below `LONER_FLOOR` (8) so the pick is reachable at all. See the module note.
 */
export const FETCH_BOND_FLOOR = 4;

/**
 * Steps the whole errand gets — out to the wall and back to the food. `stepToward` moves one axis per
 * step, so a leg costs *manhattan* distance, and a corner-to-corner fetch on a 20×15 map is ~35 each way.
 * In practice the meal ending is what stops an escort, not this; the budget is the safety valve that keeps
 * a friend from chasing a wandering loner forever. Sized to cover the ordinary case, not the pathological one.
 */
export const FETCH_STEPS = 40;

/** How much the pair's bond grows from being fetched — the `COMFORT_BOND` scale; the gesture is the point. */
export const FETCH_BOND = 2;

export const FETCH_GLYPH = '🤝';

/** `to-loner`: the friend is walking out to the edge. `to-food`: the pair is walking back in. */
export type FetchPhase = 'to-loner' | 'to-food';

export interface Escort {
  friend: string;
  loner: string;
  phase: FetchPhase;
  steps: number;
}

/**
 * Is this dino missing the meal — withdrawn *and* not already coming? The gate is both halves: a loner
 * that rushed the drop is fine (it's fed, it just has no friends), and a well-bonded dino that ignored
 * the food is merely full or lazy. Only the intersection is the dino nobody would otherwise reach.
 */
export function missingTheMeal(lonerNow: boolean, rushed: boolean): boolean {
  return lonerNow && !rushed;
}

/**
 * Who goes and gets it: the loner's closest peer clearing `FETCH_BOND_FLOOR`, or null when it has
 * nobody at all. Delegates to the bond graph's own closest-peer pick (highest bond, lexicographic
 * tie-break) rather than re-searching — the same primitive `comforter()` is built on.
 */
export function fetcher(loner: string, bonds: Bonds, peers: string[]): string | null {
  return closestFriend(loner, bonds, peers, FETCH_BOND_FLOOR);
}

/** The friend's bubble as it reaches the edge — the nudge, in the open. */
export function fetchLine(friend: string, loner: string): string {
  return `${friend}: Come on, ${loner} — food. ${FETCH_GLYPH}`;
}

/** What the fetched dino keeps — the memory that can colour the next thing it says to the keeper. */
export function fetchedMemory(friend: string): string {
  return `${friend} came and got me for the food`;
}

/** What the fetcher keeps — it gave up its own head start on the meal to do this. */
export function fetcherMemory(loner: string): string {
  return `you went and got ${loner} for the food`;
}

/** The ticker line for the keeper, who may be looking somewhere else entirely. */
export function fetchEventLine(friend: string, loner: string): string {
  return `${FETCH_GLYPH} ${friend} went to the edge for ${loner} and brought it in to the food`;
}
