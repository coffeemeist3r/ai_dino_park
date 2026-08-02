/**
 * First across (BACKLOG-343) — the single first name ever to set foot in each zone, kept forever.
 *
 * 339 already records *everyone* who has been to the grove (`groveVisited`), which is a list. This is the
 * scarcer fact underneath it: who was **first**. It costs nothing on the three founding grounds — each gets
 * its pioneer the moment anyone crosses — and becomes a real standing the day a ground opens that nobody
 * has ever stood on (BACKLOG-472's Hollow), where being first is a thing that can only happen once.
 *
 * The bowl is excluded by construction, not by a special case: a pioneer is recorded at *arrival*, and
 * nothing records one at spawn. The cast did not arrive in the bowl; it began there.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene calls `recordPioneer` from both zone-entry seams
 * (the visible crossing and the instant relocate) and renders `pioneerLine` into the collection book.
 */

import { zoneById } from './zones';

/** zoneId → the name of the first dino ever to arrive there. */
export type Pioneers = Record<string, string>;

/**
 * Record `name` as `zoneId`'s pioneer if that ground has never been founded. First write wins: a later
 * arrival never overwrites, and the same dino re-entering never re-fires. Returns whether this call
 * founded the ground — the caller's gate for the one-off beat.
 */
export function recordPioneer(map: Pioneers, zoneId: string, name: string): boolean {
  if (map[zoneId]) return false;
  map[zoneId] = name;
  return true;
}

/** The first dino ever to arrive in `zoneId`, or undefined for a ground nobody has crossed into. */
export function pioneerOf(map: Pioneers, zoneId: string): string | undefined {
  return map[zoneId];
}

/** The founding standing as it reads in the collection book. */
export function pioneerLine(zoneId: string): string {
  return `first across into ${zoneById(zoneId).name}`;
}

/** The one-off ticker line posted the moment a ground is founded. */
export function pioneerEvent(zoneId: string, name: string): string {
  return `🚩 ${name} is the first ever to set foot in ${zoneById(zoneId).name}`;
}

/** Which zone (if any) this dino founded — the book only shows the line on the pioneer's own block. */
export function foundedBy(map: Pioneers, name: string): string | undefined {
  return Object.keys(map).find((z) => map[z] === name);
}
