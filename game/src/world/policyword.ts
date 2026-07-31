/**
 * Word of how the ground decides (BACKLOG-470) — governance travels. 469 let a *hungry* dino say what its
 * ground's spend policy (463) meant to it: a private grievance or a private relief, spoken only to the
 * keeper, only while short. That's a feeling. A policy is something a ground is *known* for — so it spreads
 * the same 1-hop way the park already spreads who keeps a ground fed (453), a cold night (185), or the
 * keeper's warmth (223): "The Grove feeds its own first."
 *
 * Pure TypeScript (no Phaser, no AI): the propagation runs in Node for tests. Like its provider-word sibling
 * this one keys off *live state* rather than a remembered token — a policy is a standing, not an event — so
 * the priority is passed in by the caller and the module never touches the roles store or WorldScene.
 */

import { remember, type MemoryStore } from '../ai/memory';
import { RUMOR_MARK } from '../social/gossip';
import type { SpendPriority } from './governance';

/**
 * The word a listener remembers. Carries `RUMOR_MARK` so it reads as heard-not-witnessed and can't
 * re-spread (1 hop) — the mark alone buys that, via the gossip spine's own first-hand check.
 *
 * No article before `zoneName` — "The Grove" already carries its own (see `providerWordLine`).
 */
export function policyWordLine(speaker: string, zoneName: string, p: SpendPriority): string {
  const stance = p === 'feed' ? 'feeds its own first' : 'banks against the winter';
  return `${speaker} ${RUMOR_MARK} ${zoneName} ${stance}`;
}

/**
 * A dino lets slip how its ground has chosen to spend. Returns a null rumor (store untouched) when speaker
 * and listener are the same dino, or when the ground has **no policy** — `null` is 463's compatibility
 * seam (a zone that has never had a provider decides nothing, so there is nothing to pass on), and a ground
 * that has never decided anything should be silent about it rather than pass on a default. Both gates live
 * here rather than at the call site so no caller can skip them.
 *
 * Deliberately no setter-exclusion rung: 453 keeps a provider from talking up its own pantry because a
 * reputation is what *others* say about you, but a policy is a public fact about a ground, not a compliment
 * about a dino — the provider stating it is no weaker a beat than anyone else stating it.
 */
export function spreadPolicyWord(
  store: MemoryStore,
  speaker: string,
  listener: string,
  priority: SpendPriority | null | undefined,
  zoneName: string,
): { store: MemoryStore; rumor: string | null } {
  if (speaker === listener || !priority) return { store, rumor: null };
  const rumor = policyWordLine(speaker, zoneName, priority);
  return { store: remember(store, listener, rumor), rumor };
}
