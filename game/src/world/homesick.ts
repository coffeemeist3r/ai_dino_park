/**
 * Homesick for a friend (BACKLOG-340) — the action-mirror of the grief tic (414). A dino settled into a
 * zone (341) stops drifting; but if the one dino it's closest to (013) lives a zone away, that peace curdles
 * into homesickness — after residing a while it gets up and crosses back to rejoin its friend. Company
 * overrules scenery: a settled-but-lonely dino *leaves* its home to be near its bond, and two mutual friends
 * split by the ambient wander quietly find each other again. Milestone 2's last lore arc.
 *
 * Pure (no Phaser): the "long enough away to ache" gate and the direction toward the friend live here and are
 * unit-tested. WorldScene biases the migrant pick toward the homesick, overrides the settle-resist, starts the
 * crossing, and floats the observable beat. Reuses the very reads the grief tic uses (`closestFriend` at
 * `GRIEF_BOND_FLOOR`, `griefEdge`) so 340 and 414 always agree on *which* friend and *which* way.
 */

import { closestFriend, type Bonds } from '../social/bonds';
import { GRIEF_BOND_FLOOR, griefEdge } from './tic';
import { neighborThrough } from './zones';

/** Migration rolls a dino must reside in a friendless zone before homesickness pulls it back (~2×90 s ≈ 3 min).
 *  Below SETTLE_ROLLS (4): the ache can bite before a dino fully settles, and certainly overrides settling. */
export const HOMESICK_ROLLS = 2;

/**
 * The neighbour zone a homesick dino steps toward to rejoin its closest friend, plus that friend's name — or
 * null when it isn't homesick: it hasn't been away long enough (`rolls` < HOMESICK_ROLLS), it has no friend
 * clearing the grief floor, or its closest friend already shares its zone. Steps one zone toward the friend
 * along the west→east chain via `griefEdge` (chain-aware), so a friend two zones away is reached in two hops.
 */
export function homesickDest(
  name: string,
  myZone: string,
  bonds: Bonds,
  others: string[],
  zoneOf: (n: string) => string,
  rolls: number,
): { dest: string; friend: string } | null {
  if (rolls < HOMESICK_ROLLS) return null;
  const friend = closestFriend(name, bonds, others, GRIEF_BOND_FLOOR);
  if (!friend) return null;
  const edge = griefEdge(myZone, zoneOf(friend));
  if (!edge) return null; // friend shares the zone, or either zone is off the chain
  const dest = neighborThrough(myZone, edge);
  return dest ? { dest, friend } : null;
}

/** The one-time memory a homesick dino files when it sets off (names the friend, so the ache reads in talk). */
export function homesickMemory(friend: string): string {
  return `you miss ${friend} — the zone feels lonely without them, so you drift back to find them`;
}
