/**
 * First steps in the grove (BACKLOG-339) — arrival becomes a beat. The visible crossing (334) drops a
 * migrant at the far zone's edge with no reaction; this gives the *first* time a dino ever crosses into
 * the grove a moment of its own: it pauses to look around (🌿) and files a "first time across" memory
 * that can surface in a later greeting, before wandering on. Fires once per dino, ever.
 *
 * Pure TypeScript (no Phaser, no AI backend — the `NPCBrain` boundary stays intact): Node-testable.
 * WorldScene owns the bubble, the one-step pause, the persisted visited-set, and the save.
 */

import { GROVE_ID } from './zones';

/** A dino's first-ever arrival in the grove (so the look-around beat fires): crossing *into* the grove,
 *  and not somewhere it's already been. Crossing back to the bowl, or a return trip, is silent. */
export function firstGroveArrival(visited: readonly string[], name: string, destZone: string): boolean {
  return destZone === GROVE_ID && !visited.includes(name);
}

/** The memory a dino files the first time it crosses into the grove (rides the existing memory store). */
export function groveArrivalMemory(): string {
  return '🌿 first time across — the grove';
}

/** The look-around bubble floated on that first arrival. */
export function groveArrivalLine(): string {
  return '🌿 …somewhere new…';
}
