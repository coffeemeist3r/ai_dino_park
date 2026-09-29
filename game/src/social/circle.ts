/**
 * The keeper's inner circle (BACKLOG-127) — the top three dinos by keeper-friendship, ranked. Pure (no Phaser).
 *
 * Built out of `topBy`, the homecoming's own pick, so the circle's #1 is by construction the dino that
 * welcomes you back: one tie-break in the park, not two.
 */

import { heartsFromPoints, type Friendship } from './friendship';
import { topBy } from '../world/homecoming';

export const CIRCLE_SIZE = 3;
/** The crown popped over a dino as it joins (569 draws it; the glyph until then). */
export const CIRCLE_ART_KEY = 'circle';
export const CIRCLE_GLYPH = '♛';

export interface CircleEntry {
  name: string;
  hearts: number;
}

/** Up to `n` dinos from `roster`, highest keeper-friendship first; nobody with zero points. */
export function innerCircle(friendship: Friendship, roster: readonly string[], n = CIRCLE_SIZE): CircleEntry[] {
  const pool: Friendship = {};
  for (const name of roster) if (friendship[name]) pool[name] = friendship[name];
  const out: CircleEntry[] = [];
  while (out.length < n) {
    const best = topBy(pool);
    if (!best) break;
    out.push({ name: best.name, hearts: heartsFromPoints(best.points) });
    delete pool[best.name];
  }
  return out;
}

/** The book's line, under its title. */
export function circleLine(circle: readonly CircleEntry[]): string {
  if (!circle.length) return '♛ your inner circle: nobody yet — say hello';
  return `♛ your inner circle: ${circle.map((c, i) => `${i + 1} ${c.name} ♥${c.hearts}`).join(' · ')}`;
}

/** The ticker's line when a dino steps into the circle. */
export function joinedLine(name: string, rank: number): string {
  return `♛ ${name} has joined your inner circle (#${rank})`;
}

/** Names in `next` that were not in `prev`. */
export function newcomers(prev: readonly string[], next: readonly string[]): string[] {
  return next.filter((n) => !prev.includes(n));
}
