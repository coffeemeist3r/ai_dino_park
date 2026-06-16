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
import { COMFORT_BOND } from './comfort';

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

// ── Word of the warmth (BACKLOG-223) — the good news travels too. The bright mirror of the cold
// word: a dino the keeper warmed (184) lets that slip to the next it meets, a 1-hop rumor on the
// same gossip spine. Note `warmMemory()` contains "cold night", so a warmed dino also matches the
// cold token — the converse seam checks the warm word FIRST so a rescued dino talks about the
// rescue, not the cold.

/** A stable substring of `warmMemory()` — the tell that a remembered event is the keeper's warmth. */
export const WARM_NEWS_TOKEN = 'the keeper warmed';

/**
 * The distinct "word of the warmth" a listener remembers when a warmed dino lets it slip.
 * Carries `RUMOR_MARK` so it reads as heard-not-witnessed and can't re-spread (1 hop), and so it
 * stays visibly distinct from the speaker's own first-hand `warmMemory()`.
 */
export function warmWordLine(speaker: string): string {
  return `${speaker} ${RUMOR_MARK} the keeper came for them, warmed them right out of the cold`;
}

/**
 * One warmed dino lets the good news slip to another. If `speaker` carries a *first-hand* warm
 * memory (shareable, not itself a rumor), plant the word-of-the-warmth line on `listener` and
 * return it; otherwise return null so the caller falls back to the cold word / generic gossip.
 */
export function spreadWarmWord(
  store: MemoryStore,
  speaker: string,
  listener: string,
): { store: MemoryStore; rumor: string | null } {
  if (speaker === listener) return { store, rumor: null };
  const hasWarmNews = recall(store, speaker).some((e) => isShareable(e) && e.includes(WARM_NEWS_TOKEN));
  if (!hasWarmNews) return { store, rumor: null };
  const rumor = warmWordLine(speaker);
  return { store: remember(store, listener, rumor), rumor };
}

// ── Secondhand sympathy spurs a visit (BACKLOG-217) — the cold word becomes a deed. A dino that
// carries word of another's cold night, the next time it meets that sufferer, crosses the bowl to
// keep it company: a small bond bump (pinned to the 130 console magnitude) and a memory the
// sufferer keeps. It ignores the comfort bond-floor — hardship sparks a visit no matter how weak
// the prior bond — because the news, not closeness, is what moved the visitor.

/** The sympathy visit's bond bump — pinned to the 130 console so the two gestures can't drift. */
export const SYMPATHY_BOND = COMFORT_BOND;

/** Does `hearer` carry the word of `sufferer`'s cold night (planted by `coldWordLine`)? */
export function heardColdWordAbout(store: MemoryStore, hearer: string, sufferer: string): boolean {
  return recall(store, hearer).includes(coldWordLine(sufferer));
}

/** The memory the visited sufferer keeps — first-hand (no RUMOR_MARK), distinct from the 130 console's. */
export function cameToFindMemory(visitor: string): string {
  return `${visitor} came to find me after hearing`;
}

/** The line the visitor floats as it crosses over (contains both names + 🫂). */
export function sympathyLine(visitor: string, sufferer: string): string {
  return `${visitor}: Heard you had a rough night, ${sufferer}. 🫂`;
}

/**
 * Who, if anyone, came to find whom. If either conversing dino carries the other's cold word, that
 * carrier is the visitor and the named one is the sufferer; otherwise null. Pure detector — the
 * caller applies the bond bump (`SYMPATHY_BOND`) and files `memory` on the sufferer, so the converse
 * seam can read a pre-meeting snapshot here and apply the effect to live state.
 *
 * ponytail: fires on every later meeting while the rumor is still carried; the once-per-sorrow
 * freshness gate is BACKLOG-226.
 */
export function sympathyVisit(
  store: MemoryStore,
  a: string,
  b: string,
): { visitor: string; sufferer: string; memory: string } | null {
  if (a === b) return null;
  let visitor: string | null = null;
  let sufferer: string | null = null;
  if (heardColdWordAbout(store, a, b)) {
    visitor = a;
    sufferer = b;
  } else if (heardColdWordAbout(store, b, a)) {
    visitor = b;
    sufferer = a;
  }
  if (!visitor || !sufferer) return null;
  return { visitor, sufferer, memory: cameToFindMemory(visitor) };
}

// ── The bowl self-corrects (BACKLOG-234) — recovery un-tells the rumor. A carrier of another's
// cold word, meeting that dino and finding it warmed/recovered (it now carries a first-hand warm
// memory, 184), drops the now-false worry with relief instead of pitying it. Takes precedence over
// the sympathy visit (217): a recovered sufferer gets the all-clear, not a stale pity beat.

/** Has `name` recovered — does it carry a first-hand warm memory (the keeper warmed it, 184)? */
export function recovered(store: MemoryStore, name: string): boolean {
  return recall(store, name).some((e) => isShareable(e) && e.includes(WARM_NEWS_TOKEN));
}

/** The relieved line the corrector floats on seeing the sufferer is fine (both names + 😌). */
export function reliefLine(corrector: string, sufferer: string): string {
  return `${corrector}: Oh — you're alright now, ${sufferer}! 😌`;
}

/** The first-hand memory the corrector keeps — distinct from the came-to-find / cold / warm notes. */
export function reliefMemory(sufferer: string): string {
  return `saw ${sufferer} came through it fine`;
}

/**
 * Who, if anyone, should drop a stale cold rumor about whom. If a conversing dino carries the
 * other's cold word AND that other has recovered, the carrier is the `corrector`, the named one the
 * `sufferer`, and `dropped` is the exact `coldWordLine(sufferer)` to forget; otherwise null. Pure
 * detector mirroring `sympathyVisit` — the caller forgets `dropped` + files `memory` on live state.
 */
export function selfCorrect(
  store: MemoryStore,
  a: string,
  b: string,
): { corrector: string; sufferer: string; dropped: string; memory: string } | null {
  if (a === b) return null;
  let corrector: string | null = null;
  let sufferer: string | null = null;
  if (heardColdWordAbout(store, a, b) && recovered(store, b)) {
    corrector = a;
    sufferer = b;
  } else if (heardColdWordAbout(store, b, a) && recovered(store, a)) {
    corrector = b;
    sufferer = a;
  }
  if (!corrector || !sufferer) return null;
  return { corrector, sufferer, dropped: coldWordLine(sufferer), memory: reliefMemory(sufferer) };
}

// ── Relief travels too (BACKLOG-235) — the retraction becomes news. The bright twin of the cold
// word: a dino that dropped a stale cold rumor (234) now carries a first-hand relief memory, and
// leads with that all-clear when it next meets another — a 1-hop rumor on the same gossip spine, so
// a third dino never near the sufferer learns the worry is over. The bowl actively un-tells it.

/** A stable substring of `reliefMemory()` — the tell that a remembered event is a recovery all-clear. */
export const RELIEF_NEWS_TOKEN = 'came through it fine';

/**
 * The distinct "word of the relief" a listener remembers when a corrector lets the all-clear slip.
 * Built from the corrector's first-hand `reliefMemory` (`saw <X> came through it fine`): the leading
 * `saw ` is dropped so the retelling reads as news, and `RUMOR_MARK` is prefixed so it reads as
 * heard-not-witnessed and can't re-spread (1 hop) — distinct from the corrector's own memory.
 */
export function reliefWordLine(speaker: string, reliefMem: string): string {
  return `${speaker} ${RUMOR_MARK} ${reliefMem.replace(/^saw /, '')}`;
}

/**
 * One corrector lets the all-clear slip to another. If `speaker` carries a *first-hand* relief
 * memory (shareable, not itself a rumor), plant the word-of-the-relief line on `listener` and return
 * it; otherwise return null so the caller falls back to the warm word / cold word / generic gossip.
 */
export function spreadReliefWord(
  store: MemoryStore,
  speaker: string,
  listener: string,
): { store: MemoryStore; rumor: string | null } {
  if (speaker === listener) return { store, rumor: null };
  const mem = recall(store, speaker).find((e) => isShareable(e) && e.includes(RELIEF_NEWS_TOKEN));
  if (!mem) return { store, rumor: null };
  const rumor = reliefWordLine(speaker, mem);
  return { store: remember(store, listener, rumor), rumor };
}

// ── Grateful to the one who cleared your name (BACKLOG-243) — the giving side of the relief arc,
// the symmetric twin of the sympathy visit (217). Where 217 turns a *worry* into a deed (a carrier
// crosses to comfort), this turns the *all-clear* into a bond: a recovered sufferer, meeting the
// dino carrying its first-hand relief memory (the one `spreadReliefWord` spreads), warms to it.

/** The grateful bump — pinned to the 130 console magnitude, exactly as `SYMPATHY_BOND` is, so the two gestures can't drift. */
export const GRATEFUL_BOND = COMFORT_BOND;

/**
 * Does `clearer` hold the *first-hand* relief memory about `sufferer` — `saw <sufferer> came through
 * it fine`? Exact match (mirrors `heardColdWordAbout`); `isShareable` excludes a downstream hearer of
 * the relief *rumor* (`<x> told me: <sufferer> came through it fine`), so only the one who actually
 * cleared the name counts.
 */
export function clearedMyName(store: MemoryStore, clearer: string, sufferer: string): boolean {
  return recall(store, clearer).some((e) => isShareable(e) && e === reliefMemory(sufferer));
}

/** The first-hand memory the recovered sufferer keeps — distinct from cold/warm/relief/came-to-find. */
export function gratefulMemory(clearer: string): string {
  return `${clearer} cleared my name`;
}

/** The line the grateful sufferer floats (both names + 💛, a register distinct from 🫂/😌/😊/🥶). */
export function gratefulLine(sufferer: string, clearer: string): string {
  return `${sufferer}: Thanks for setting them straight, ${clearer}. 💛`;
}

/**
 * Who, if anyone, should thank whom. If a conversing dino carries the *other's* first-hand relief
 * memory, that other is the `clearer` and the carrier's subject is the `sufferer` — the recovered
 * dino warms to the one spreading its all-clear. Pure detector mirroring `sympathyVisit`/`selfCorrect`
 * — the caller applies the `GRATEFUL_BOND` bump and files `memory` on the sufferer.
 *
 * ponytail: fires on every later meeting while the relief memory persists, like the sympathy visit;
 * the once-per-clearing freshness gate is BACKLOG-244/250 territory.
 */
export function clearedName(
  store: MemoryStore,
  a: string,
  b: string,
): { sufferer: string; clearer: string; memory: string } | null {
  if (a === b) return null;
  let clearer: string | null = null;
  let sufferer: string | null = null;
  if (clearedMyName(store, a, b)) {
    clearer = a;
    sufferer = b;
  } else if (clearedMyName(store, b, a)) {
    clearer = b;
    sufferer = a;
  }
  if (!clearer || !sufferer) return null;
  return { sufferer, clearer, memory: gratefulMemory(clearer) };
}
