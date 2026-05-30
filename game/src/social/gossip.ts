/**
 * Gossip propagation (BACKLOG-019) — when two dinos meet, one passes a recent
 * first-hand memory to the other as second-hand news. The rumor lands in the
 * listener's memory marked so it won't be re-gossiped (1 hop), which keeps news
 * spreading through the park without looping forever.
 *
 * Pure TypeScript (no Phaser): the propagation logic runs in Node for tests.
 * The memory store and the spoken bubble are wired up in WorldScene.
 */

import { remember, recall, type MemoryStore } from '../ai/memory';

/** A memory carrying this marker is itself a rumor — heard, not witnessed — so it doesn't re-spread. */
export const RUMOR_MARK = 'told me:';

/** Rewrite a dino's own first-person memory into the third person for retelling. */
export function swapPronouns(s: string): string {
  return s
    .replace(/\byou'd\b/gi, 'they would')
    .replace(/\byou're\b/gi, 'they are')
    .replace(/\byour\b/gi, 'their')
    .replace(/\byou\b/gi, 'they');
}

/** An event is shareable if it's first-hand (not itself a rumor the dino merely heard). */
export function isShareable(event: string): boolean {
  return !event.includes(RUMOR_MARK);
}

/** Pick the most recent first-hand event worth retelling, or null if there's nothing. */
export function pickGossip(events: string[]): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    if (isShareable(events[i])) return events[i];
  }
  return null;
}

/** Format a speaker's event as a rumor the listener will remember. */
export function makeRumor(speaker: string, event: string): string {
  return `${speaker} ${RUMOR_MARK} ${swapPronouns(event)}`;
}

/**
 * Spread one piece of gossip from `speaker` to `listener` in the memory store.
 * Returns the updated store and the rumor line (null if the speaker had nothing
 * first-hand to share).
 */
export function spreadGossip(
  store: MemoryStore,
  speaker: string,
  listener: string,
): { store: MemoryStore; rumor: string | null } {
  if (speaker === listener) return { store, rumor: null };
  const event = pickGossip(recall(store, speaker));
  if (!event) return { store, rumor: null };
  const rumor = makeRumor(speaker, event);
  return { store: remember(store, listener, rumor), rumor };
}
