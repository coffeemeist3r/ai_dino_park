/**
 * Read the Room (BACKLOG-157, the second ability) — AETHER-1's distinct power.
 *
 * The diplomat's *refusal* for LUMEN-3's Field Scan has read, since cycle 38:
 * "A diplomat does not pry into a mind. I read the room, not the soul."
 * That sentence sat in `keeper/scan.ts` for 126 cycles as a consolation prize. This module makes it
 * the ability. Lux reads one mind and it is a spoiler; Aki reads the whole floor and it is a map of
 * the party — a different *kind* of knowledge, which is what "a real read on which observer you
 * chose" has to mean if the roster is to be more than four sets of affinity weights.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene only paints the lines.
 */

import { bondPoints, type Bonds } from '../social/bonds';
import { stargazingPairs } from '../world/skyEvent';
import type { Keeper } from './keepers';

/** How close two dinos have to be, in tiles (Chebyshev), to count as standing together. */
export const ROOM_RADIUS = 2;

/** Bond points at or above which a pair reads as `at ease` rather than `edgy`. */
export const EASE_BOND = 20;

export interface RoomMember {
  name: string;
  tileX: number;
  tileY: number;
  /** The ground this one is standing on. Absent → the same unnamed ground, as `Gazer` treats it. */
  zone?: string;
}

/** Only the diplomat reads a room. Everyone else gets a refusal. */
export function canReadRoom(keeper: Keeper): boolean {
  return keeper.id === 'aether';
}

/**
 * The floor, as AETHER-1 reads it. Deterministic: pure formatting over the members and the bond
 * graph, sorted so the same input gives byte-identical output.
 *
 * Every line has to be something the input actually supports — the two closers are mutually
 * exclusive and each is emitted only when it is true, because a readout that says "everyone here has
 * somebody" over an empty room is worse than a readout that says nothing.
 */
export function roomLines(members: RoomMember[], bonds: Bonds, place?: string): string[] {
  const lines = ['— Read the Room —'];
  if (place) lines.push(place);

  // Reuses skyEvent's pair-finder rather than growing a second one: it is already same-zone-aware
  // (the CHARTER v7 fix that stopped the park knitting bonds across grounds), and a second copy
  // would be a second place for that bug to come back.
  const pairs = stargazingPairs(members, ROOM_RADIUS)
    .map(([a, b]) => (a < b ? [a, b] : [b, a]) as [string, string])
    .sort((x, y) => x[0].localeCompare(y[0]) || x[1].localeCompare(y[1]));

  for (const [a, b] of pairs) {
    lines.push(`${a} & ${b} — ${bondPoints(bonds, a, b) >= EASE_BOND ? 'at ease' : 'edgy'}`);
  }

  const paired = new Set(pairs.flat());
  const alone = members
    .map((m) => m.name)
    .filter((n) => !paired.has(n))
    .sort((a, b) => a.localeCompare(b));
  if (alone.length) lines.push(`alone: ${alone.join(', ')}`);

  if (members.length >= 2) {
    if (pairs.length && !alone.length) lines.push('everyone here has somebody');
    else if (!pairs.length) lines.push('nobody here is standing near anybody');
  }
  return lines;
}

// Written, not defaulted. The in-character refusals are the half of Field Scan that actually made
// the roster feel chosen, and a generic "this unit cannot" would undo that for three of four seats.
const REFUSALS: Record<string, string> = {
  vanta: 'VANTA-9: "I read terrain, not tempers. Ask me where they are, not how they feel about it."',
  lumen: 'LUMEN-3: "I catalogue specimens one at a time. A crowd is not a record."',
  kestrel: 'Kes: *keeps to the edge* "I don\'t walk into the middle of anything. That\'s rather the point."',
};

/** An in-character demurral for observers without the diplomat's read. Empty for AETHER-1. */
export function roomRefusal(keeper: Keeper): string {
  if (canReadRoom(keeper)) return '';
  return REFUSALS[keeper.id] ?? `${keeper.name}: "This one does not read a room."`;
}
