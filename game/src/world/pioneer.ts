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

import { theZone, zoneById } from './zones';

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

/**
 * How a ground came to be founded (BACKLOG-516).
 *
 * 343 recorded *who* and stopped there, because while a pioneer was only ever written at arrival there was
 * only one way it could happen. 512 ended that: five grounds are founded by the dino the roster wakes on
 * them, and calling that a crossing is a sentence the book prints on the first frame of every save about
 * something that never happened.
 *
 * The kind is derived, never stored — `foundingKind` in `founding.ts` compares the record against the
 * founding roster. It is passed *in* here rather than looked up, so this module keeps no dependency on the
 * founding state and the two files cannot form a cycle.
 */
export type FoundingKind = 'born' | 'crossed';

/**
 * The founding standing as it reads in the collection book.
 *
 * Two sentences, and the difference between them is the difference between an inheritance and a decision:
 * a dino that woke up on its ground has *been* there, a dino that walked in was *first across*. Both route
 * the ground's name through `theZone` (499) — the article belongs to the sentence, not to the name.
 */
export function pioneerLine(zoneId: string, kind: FoundingKind): string {
  const zone = theZone(zoneById(zoneId).name);
  return kind === 'born' ? `has been in ${zone} since the first morning` : `first across into ${zone}`;
}

/** The one-off ticker line posted the moment a ground is founded. */
export function pioneerEvent(zoneId: string, name: string): string {
  return `🚩 ${name} is the first ever to set foot in ${theZone(zoneById(zoneId).name)}`;
}

/** Which zone (if any) this dino founded — the book only shows the line on the pioneer's own block. */
export function foundedBy(map: Pioneers, name: string): string | undefined {
  return Object.keys(map).find((z) => map[z] === name);
}
