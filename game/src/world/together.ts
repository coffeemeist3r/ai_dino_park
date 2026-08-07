/**
 * Two who go together (BACKLOG-360) — the first time this park puts two dinos on the road at once.
 *
 * Every crossing built in 124 cycles moves exactly one body: the ambient wander (334), homesickness (340),
 * scarcity (450), hearsay (458), longing (362). The bond graph has never once had a say in *who travels
 * with whom*. Meanwhile 346 has been filing `🌿 traded pond stories with <name>` into the memory ring since
 * cycle 76 — a durable, persisted, per-pair record of two dinos who bonded over a place — and nothing has
 * ever read it back. This is the thing that reads it.
 *
 * It is a **companion pull**, not a second decision: the companion rides the destination its friend already
 * chose, and never picks one. That keeps every destination read (`scarcityDestOf`, `plentyDestOf`,
 * `yearnDestOf`) and the migrant pick untouched, which matters because those tiers are pinned by specs
 * going back to cycle 76.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene owns the seam, the bonds and the crossing.
 */

import { pondSwapMemory } from './groveword';

/**
 * The road's bond, deliberately *below* `POND_BOND` (3): discovering you both know a place is the bigger
 * beat; going back to it together is the smaller, warmer follow-up.
 */
export const TOGETHER_BOND = 2;

/** What each of the pair keeps: who they went with, and where they went back to. */
export function togetherMemory(other: string, zoneName: string): string {
  return `🐾 went back to ${zoneName} with ${other}`;
}

/** The companion's bubble as it falls in beside its friend. */
export function togetherLine(): string {
  return '…with you.';
}

/** The ticker line — names both, and the ground they're both bound for. */
export function togetherEvent(leader: string, companion: string, zoneName: string): string {
  return `🐾 ${leader} and ${companion} set off for ${zoneName} together`;
}

/**
 * The dino this one traded pond stories with, out of `candidates`. First match in candidate order — a
 * `Math.random` over a pickable set is exactly the shape BACKLOG-456 catalogues, so where two companions
 * are eligible the choice is positional and a test can pin it.
 */
export function pondCompanion(
  leaderMemories: readonly string[],
  candidates: readonly string[],
): string | null {
  return candidates.find((c) => leaderMemories.includes(pondSwapMemory(c))) ?? null;
}

/**
 * Does this crossing carry a companion? Only when it is bound for the very ground the pair bonded over.
 * `sharedZone` is a parameter rather than a constant because 346 happens to record exactly one place; a
 * second shared-place bond becomes a caller change here rather than a rewrite of this module.
 */
export function travelsTogether(
  dest: string,
  sharedZone: string,
  leaderMemories: readonly string[],
  candidates: readonly string[],
): string | null {
  if (dest !== sharedZone) return null;
  return pondCompanion(leaderMemories, candidates);
}
