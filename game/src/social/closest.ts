/**
 * Who each dino is closest to, as the player reads it (BACKLOG-134). Pure (no Phaser).
 *
 * The closeness rule itself is `closestFriend` (013) over the loner floor — this module only adds what a
 * *displayed* answer needs: hysteresis, so two near-equal friends do not trade places every step, and the
 * words the book and the ticker use.
 */

import { bondPoints, closestFriend, type Bonds } from './bonds';
import { LONER_FLOOR } from '../world/loner';

/** How far a challenger's bond must beat the current friend's before it takes the place. */
export const SHIFT_MARGIN = 5;

/**
 * `name`'s closest friend among `others`, keeping `current` unless a challenger beats it by `SHIFT_MARGIN`.
 * A current friend who has left `others`, or fallen under the floor, gives way to the plain pick.
 */
export function bestFriend(name: string, current: string | null, bonds: Bonds, others: readonly string[]): string | null {
  const top = closestFriend(name, bonds, [...others], LONER_FLOOR);
  if (!top || !current || top === current || !others.includes(current)) return top;
  const held = bondPoints(bonds, name, current);
  if (held < LONER_FLOOR) return top;
  return bondPoints(bonds, name, top) >= held + SHIFT_MARGIN ? top : current;
}

/**
 * The bond at which the book calls a pair **close** — and, since BACKLOG-136, the bar a friend must clear to
 * walk over to a dino sore from the hatch. What the book promises is what the park does.
 */
export const CLOSE_BOND = 25;

/** The book's line: how close, and to whom. */
export function friendLine(friend: string | null, bond: number): string {
  if (!friend) return '🤝 no friend yet';
  if (bond >= 60) return `🤝 thick as thieves with ${friend}`;
  if (bond >= CLOSE_BOND) return `🤝 close to ${friend}`;
  return `🤝 friendly with ${friend}`;
}

/** The ticker's line when one friend overtakes another. */
export function shiftLine(name: string, from: string, to: string): string {
  return `💞 ${name} has grown closer to ${to} than to ${from}`;
}
