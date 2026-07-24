/**
 * Word of plenty (BACKLOG-458) — plenty travels by talk before a body follows it. 450 moves mouths toward
 * plenty on a live prosperity read; 457 gave that mover a voice. This is the hearsay half: a dino that only
 * *heard* a neighbour zone is thriving is primed to migrate there, the way grove-news (345) tugs a never-been
 * newcomer across — but pointed at the food economy instead of a pond. A resident of a thriving zone lets the
 * word slip on the 1-hop gossip spine (019/342/453); the listener carries it, and on the next migration roll
 * it heads for the ground it only heard was good.
 *
 * Pure TypeScript (no Phaser, no AI): the seed line, the rumor, and the target read all run in Node for
 * tests. WorldScene seeds the first-hand memory (a thriving-zone resident), spreads the word in the meeting
 * cascade, and consumes `plentyTarget` in `pickMigrant` / the crossing destination.
 *
 * Twin of `world/groveword.ts` — same shape, plenty instead of scenery — which is why the meeting cascade
 * checks it after cold/warm/relief/grove/provider (a specific "this ground is thriving" beats a generic
 * retelling, but a worry outranks it) and before generic gossip.
 */

import { remember, recall, type MemoryStore } from '../ai/memory';
import { RUMOR_MARK, isShareable } from '../social/gossip';
import { ZONES } from './zones';

/** The stable tell that a remembered event is plenty-word — present in both the first-hand seed and the rumor. */
export const PLENTY_TOKEN = 'is thriving';

/** The first-hand memory a resident of a thriving zone files — shareable, so it spreads. Names the zone. No
 *  leading article: two of three zone names already carry their own ("The Grove"). */
export function plentyMemory(zoneName: string): string {
  return `🌾 ${zoneName} ${PLENTY_TOKEN} — saw it yourself`;
}

/** The word-of-plenty a listener remembers when a carrier lets it slip. Carries `RUMOR_MARK` so it reads as
 *  heard-not-witnessed and can't re-spread (1 hop), and still contains `<zoneName> is thriving` so the
 *  listener's `plentyTarget` can recover which ground was praised. */
export function plentyWordLine(speaker: string, zoneName: string): string {
  return `${speaker} ${RUMOR_MARK} ${zoneName} ${PLENTY_TOKEN}`;
}

/** The ZONES entry whose name appears in `event` right before the plenty token, or null. The name→id map is
 *  how a remembered string is turned back into a migration destination. */
function plentyZoneNamed(event: string): { id: string; name: string } | null {
  if (!event.includes(PLENTY_TOKEN)) return null;
  for (const z of ZONES) {
    if (event.includes(`${z.name} ${PLENTY_TOKEN}`)) return { id: z.id, name: z.name };
  }
  return null;
}

/**
 * A dino lets word of plenty slip to another. Plants the word on `listener` only when `speaker` carries a
 * *first-hand* plenty memory (shareable, not itself a rumor) — a listener who merely heard it can't re-spread
 * (1 hop), and speaker===listener is a no-op. Mirror of `spreadGroveWord`.
 */
export function spreadPlentyWord(
  store: MemoryStore,
  speaker: string,
  listener: string,
): { store: MemoryStore; rumor: string | null } {
  if (speaker === listener) return { store, rumor: null };
  const firstHand = recall(store, speaker).find((e) => isShareable(e) && !!plentyZoneNamed(e));
  const zone = firstHand ? plentyZoneNamed(firstHand) : null;
  if (!zone) return { store, rumor: null };
  const rumor = plentyWordLine(speaker, zone.name);
  return { store: remember(store, listener, rumor), rumor };
}

/**
 * The zone a dino is primed toward by plenty-word (BACKLOG-458): the newest plenty memory (first-hand or
 * heard) naming a zone that isn't the dino's current one, as a zone id — or null when it carries none, or
 * only word of its own ground. WorldScene filters this to a reachable neighbour before priming the migration.
 */
export function plentyTarget(events: readonly string[], currentZoneId: string): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const zone = plentyZoneNamed(events[i]);
    if (zone && zone.id !== currentZoneId) return zone.id;
  }
  return null;
}
