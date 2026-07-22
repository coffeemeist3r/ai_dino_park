/**
 * Word of the provider (BACKLOG-453) — the park's first *economic* standing (448) travels the way its
 * hardships and kindnesses always have. A dino meeting another lets slip who keeps their ground fed
 * ("The Fernreach eats because of Sunny"), the same 1-hop way word of a cold night (185), the keeper's
 * warmth (223), or news of the grove (342) spreads.
 *
 * Pure TypeScript (no Phaser, no AI): the propagation runs in Node for tests. Unlike its sibling rungs
 * this one keys off *live state* rather than a remembered token — a role is a standing, not an event —
 * so the provider is passed in by the caller. That keeps the module free of the roles store entirely.
 */

import { remember, type MemoryStore } from '../ai/memory';
import { RUMOR_MARK } from '../social/gossip';

/**
 * The word a listener remembers. Carries `RUMOR_MARK` so it reads as heard-not-witnessed and can't
 * re-spread (1 hop), like every other rumor line.
 *
 * No article before `zoneName` — "The Grove" already carries its own (see `storesFedLine`).
 */
export function providerWordLine(speaker: string, provider: string, zoneName: string): string {
  return `${speaker} ${RUMOR_MARK} ${zoneName} eats because of ${provider}`;
}

/**
 * A dino lets the provider's standing slip to another. Returns a null rumor (store untouched) when there's
 * nobody to name, when speaker and listener are the same dino, or — the rule that matters — when the
 * **speaker is the provider**: reputation is what others say about you, and a provider talking up its own
 * pantry is a different, weaker beat. Enforced here rather than at the call site so no caller can skip it.
 */
export function spreadProviderWord(
  store: MemoryStore,
  speaker: string,
  listener: string,
  provider: string | null,
  zoneName: string,
): { store: MemoryStore; rumor: string | null } {
  if (speaker === listener || !provider || speaker === provider) return { store, rumor: null };
  const rumor = providerWordLine(speaker, provider, zoneName);
  return { store: remember(store, listener, rumor), rumor };
}
