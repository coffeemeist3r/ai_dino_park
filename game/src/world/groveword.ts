/**
 * Tell of the grove (BACKLOG-342) — news of the second zone travels the bowl. A dino freshly back
 * from the grove (a return crossing, 334) carries word of what it saw over there and leads its next
 * meeting with it, the same 1-hop way word of a cold night (185) or the keeper's warmth (223) spreads.
 *
 * Pure TypeScript (no Phaser, no AI): the propagation runs in Node for tests. The bright counterpart
 * of `spreadColdWord` — same shape, scenery instead of hardship — which is why the cascade in
 * WorldScene checks it *after* cold/warm/relief (a worry outranks a postcard) and before generic gossip.
 */

import { remember, recall, type MemoryStore } from '../ai/memory';
import { RUMOR_MARK, isShareable } from '../social/gossip';

/** A stable substring of `groveNewsMemory()` — the tell that a remembered event is grove news. */
export const GROVE_NEWS_TOKEN = 'pond over in the grove';

/** The first-hand memory a returning dino files about the grove — shareable, so it spreads. */
export function groveNewsMemory(): string {
  return '🌿 saw the pond over in the grove';
}

/**
 * The "word of the grove" a listener remembers when a just-returned dino leads with it. Carries
 * `RUMOR_MARK` so it reads as heard-not-witnessed and can't re-spread (1 hop), and stays distinct
 * from the speaker's own first-hand `groveNewsMemory()`.
 */
export function groveWordLine(speaker: string): string {
  return `${speaker} ${RUMOR_MARK} you should see the pond over in the grove`;
}

/**
 * A just-returned dino lets grove news slip to another. If `speaker` carries a *first-hand* grove
 * memory (shareable, not itself a rumor), plant the word-of-the-grove line on `listener` and return
 * it; otherwise return null so the caller falls back to generic gossip.
 */
export function spreadGroveWord(
  store: MemoryStore,
  speaker: string,
  listener: string,
): { store: MemoryStore; rumor: string | null } {
  if (speaker === listener) return { store, rumor: null };
  const hasGroveNews = recall(store, speaker).some((e) => isShareable(e) && e.includes(GROVE_NEWS_TOKEN));
  if (!hasGroveNews) return { store, rumor: null };
  const rumor = groveWordLine(speaker);
  return { store: remember(store, listener, rumor), rumor };
}
