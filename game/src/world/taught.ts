/**
 * The one who knew first (BACKLOG-364) — being the dino that had already been somewhere.
 *
 * The park has spread news for seventy cycles: gossip (019), the cold word (185), the warm word (223),
 * grove news (342), word of the provider (453), of the policy (470), of plenty (458). Every one of them
 * moves a fact from a speaker to a listener and gives the *listener* the memory. The speaker is a pipe.
 *
 * This one marks the teller. A dino that has set foot on a ground and meets one that hasn't shows it the
 * way, and keeps the telling: `showed Sunny The Hollow`. Knowledge becomes standing — the CHARTER's
 * distinctness goal applied to what a dino has *seen* rather than to its temperament.
 *
 * The record it reads (`SeenZones`) is the general form of 339's grove-only `groveVisited`, which stays
 * exactly where it is: 339/342/346 are shipped grove beats pinned by the cycle-076/078 specs, and folding
 * them into this would be a refactor wearing a feature's clothes.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene owns the mutable record and the meeting seam.
 */

import { RUMOR_MARK } from '../social/gossip';

/** dino name → the ids of every ground it has actually set foot on. */
export type SeenZones = Record<string, string[]>;

/**
 * Record that `name` has seen `zone`. Mutates in place and returns whether this was new — the same
 * contract as `recordPioneer`, so the two arrival seams read alike and neither needs a return-value dance.
 */
export function markSeen(map: SeenZones, name: string, zone: string): boolean {
  const seen = (map[name] ??= []);
  if (seen.includes(zone)) return false;
  seen.push(zone);
  return true;
}

/** Has this dino set foot on this ground? */
export function hasSeen(map: SeenZones, name: string, zone: string): boolean {
  return (map[name] ?? []).includes(zone);
}

/**
 * The ground a speaker can show a listener: the first in `chain` order it has seen and the listener has
 * not. Chain order (west→east) rather than "most recent" or a random pick, so the same pair meeting twice
 * teaches the same ground — a random pick here is the BACKLOG-456 flake shape, and "most recent" would make
 * the beat depend on travel order in a way no test could pin.
 */
export function teachableZone(
  map: SeenZones,
  speaker: string,
  listener: string,
  chain: readonly string[],
): string | null {
  if (speaker === listener) return null;
  return chain.find((z) => hasSeen(map, speaker, z) && !hasSeen(map, listener, z)) ?? null;
}

/** The teller's pride, naming who it showed and where. The dedup key for the beat, and the book's input. */
export function taughtMemory(listener: string, zoneName: string): string {
  return `🚩 showed ${listener} ${zoneName}`;
}

/** What the listener keeps: `RUMOR_MARK`ed, so it is heard-not-witnessed and can never re-spread (1 hop). */
export function taughtWordLine(speaker: string, zoneName: string): string {
  return `${speaker} ${RUMOR_MARK} there's a whole other ground out there — ${zoneName}`;
}

/** The bubble the teller floats. */
export function taughtLine(zoneName: string): string {
  return `🚩 …you've never been to ${zoneName}?`;
}

/** The ticker line: who showed whom what. */
export function taughtEvent(speaker: string, listener: string, zoneName: string): string {
  return `🚩 ${speaker} tells ${listener} about ${zoneName} — they'd never been`;
}

/** The bond a telling earns. Under `POND_BOND` (3) on purpose: a place you have *both* stood on is a
 *  stronger tie than one you have merely described. The calibration knob. */
export const TAUGHT_BOND = 2;

/** A stable prefix of `taughtMemory` — the tell that a remembered event is a telling. */
const TAUGHT_MARK = '🚩 showed ';

/**
 * Fold a dino's own memory ring into the teaching it has done most: the ground it has told the most dinos
 * about, and how many of those tellings it still carries. Reads the live ring (the `foodwebStanding` 443
 * precedent) rather than persisting a tally — so a dino's standing here is what it *remembers* doing,
 * which is the same rule every other memory-derived read in the park follows. First-seen wins a tie, so it
 * is deterministic.
 */
export function taughtCount(memories: readonly string[]): { zoneName: string; count: number } | null {
  const counts = new Map<string, number>();
  for (const m of memories) {
    if (!m.startsWith(TAUGHT_MARK)) continue;
    // `🚩 showed <listener> <Zone Name>` — the listener is one token, the ground is the rest.
    const rest = m.slice(TAUGHT_MARK.length);
    const zoneName = rest.slice(rest.indexOf(' ') + 1);
    if (!zoneName) continue;
    counts.set(zoneName, (counts.get(zoneName) ?? 0) + 1);
  }
  let best: { zoneName: string; count: number } | null = null;
  for (const [zoneName, count] of counts) if (!best || count > best.count) best = { zoneName, count };
  return best;
}

/** The standing as it reads in the collection book. */
export function taughtBookLine(zoneName: string, count: number): string {
  return `showed ${count} other${count === 1 ? '' : 's'} the way to ${zoneName}`;
}
