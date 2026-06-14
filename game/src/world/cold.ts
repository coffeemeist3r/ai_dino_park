/**
 * Cold-night shiver (BACKLOG-179) — the dino left out of the winter den. Cycle 171 made the
 * winter den pack; this reads the *other* half: a dino that never huddled across a winter night
 * sleeps cold, and at morning it shivers and remembers it.
 *
 * Pure TypeScript (no Phaser): Node-testable. Only deep winter is cold enough to leave a mark —
 * the warm seasons cost a sleeper nothing.
 */

import type { Season } from './seasons';
import type { Personality } from '../ai/personality';
import { greetGain } from '../social/friendship';
import { RUMOR_MARK, isShareable } from '../social/gossip';
import { recall, remember, type MemoryStore } from '../ai/memory';

/** The only season cold enough to leave a dino shivering. */
export const COLD_SEASON: Season = 'winter';

/** Did a dino sleep out in the cold? True only on a winter night it never once huddled. */
export function sleptCold(huddledTonight: boolean, season: Season): boolean {
  return season === COLD_SEASON && !huddledTonight;
}

/** The shiver bubble floated over a dino that slept cold (morning after a winter night). */
export function coldShiver(): string {
  return '🥶 brr… a cold night, slept alone';
}

/** The memory a cold-slept dino files — woven into its next-morning greeting context. */
export function coldMemory(): string {
  return 'shivered through a cold night, slept alone 🥶';
}

// ── Keeper's warmth (BACKLOG-184) — the mend. The 125 repair shape brought to winter: a
// greet or a meal from the keeper thaws a cold funk early, with an outsized gain and a
// memory that warms the next hello. The trio mirrors repair.ts exactly.

/** Extra points a warming greet/meal earns — deliberately the repair-bonus magnitude. */
export const WARM_BONUS = 6;

/** A warming greet's gain: a normal greet (warmth/sociability still scale) plus the bonus. */
export function warmGain(traits?: Personality): number {
  return greetGain(traits) + WARM_BONUS;
}

/** The floating line over a dino the keeper just warmed. */
export function warmLine(name: string): string {
  return `${name} stops shivering 😊`;
}

/** The memory a warmed dino keeps; WorldScene folds this into the store. */
export function warmMemory(): string {
  return 'the keeper warmed me after a cold night';
}

// ── Nobody came (BACKLOG-208) — the inverse of the mend. A funk the keeper never warmed
// thaws silently at dusk, but it leaves the colder note: neglect made as legible as care.

/**
 * The memory a shiverer the keeper never came for files at the silent dusk thaw — harder than
 * the plain cold note, it compounds with it and tinges the next greeting. No 🥶 of its own:
 * this is the morning *after* the cold, the hurt of having been left, not the cold itself.
 */
export function neglectMemory(): string {
  return 'shivered all morning; nobody came 😞';
}

// ── Word of the cold (BACKLOG-185) — the night's hardship travels. A dino that slept cold
// leads with the news when it next meets another: a distinct rumor planted on the gossip spine.

/** A stable substring of `coldMemory()` — the tell that a remembered event is about a cold night. */
export const COLD_NEWS_TOKEN = 'cold night';

/**
 * The distinct "word of the cold" a listener remembers when a cold-slept dino lets it slip.
 * Carries `RUMOR_MARK` so it reads as heard-not-witnessed and can't re-spread (1 hop), and so it
 * stays visibly distinct from the speaker's own first-hand `coldMemory()`.
 */
export function coldWordLine(speaker: string): string {
  return `${speaker} ${RUMOR_MARK} the frost got into their bones — slept the whole night alone`;
}

/**
 * One cold-slept dino lets the news slip to another. If `speaker` carries a *first-hand* cold
 * memory (shareable, not itself a rumor), plant the word-of-the-cold line on `listener` and
 * return it; otherwise return null so the caller falls back to generic gossip.
 */
export function spreadColdWord(
  store: MemoryStore,
  speaker: string,
  listener: string,
): { store: MemoryStore; rumor: string | null } {
  if (speaker === listener) return { store, rumor: null };
  const hasColdNews = recall(store, speaker).some((e) => isShareable(e) && e.includes(COLD_NEWS_TOKEN));
  if (!hasColdNews) return { store, rumor: null };
  const rumor = coldWordLine(speaker);
  return { store: remember(store, listener, rumor), rumor };
}
