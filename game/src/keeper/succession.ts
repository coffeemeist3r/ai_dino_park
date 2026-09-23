/**
 * What the bowl makes of the watcher *leaving* (BACKLOG-162) — the other side of `keeper/voice.ts`.
 *
 * `voice.ts` gave the park a vocabulary for what a dino can see when it looks at you: the hum, the
 * unblinking red eye, the round eye that writes you down, the almost-family smell. Four notes, keyed by
 * roster id, temperament-shaded. This module is that vocabulary in the past tense — the absence of a
 * **specific** watcher, which is the whole difficulty of the item.
 *
 * "Something is different about you" is a system announcing itself. "There was a humming one before you,
 * and it isn't humming now" is a dinosaur with an opinion about Aki. The save has carried `previousId`
 * and a `switches` count since BACKLOG-555, and the cast has never once mentioned either.
 *
 * Pure TypeScript (no Phaser, no inference): Node-testable. WorldScene owns the map and the save.
 */

import { PRICKLY_MAX, EFFUSIVE_MIN } from '../ai/brain';
import type { Personality } from '../ai/personality';
import { keeperFit, nicknameOf, type Keeper } from './keepers';

/** The three shades every aside register in `brain.ts` carries — `voice.ts`'s shape, deliberately. */
interface Note {
  prickly: string;
  warm: string;
  plain: string;
}

/**
 * How much better the departed watcher had to suit this animal for it to notice the loss.
 *
 * **Measured, not chosen** — CHARTER v7's corollary says a constant calibrated so the founding park sits
 * inert beneath it is a defect, so this one was set by computing `keeperFit` over the founding roster's
 * name-seeded traits against all twelve ordered watcher pairs *first*. The smallest per-dino maximum fit
 * drop is Thornback's 0.63, so every one of the eight founding dinos clears 0.5 on at least one pair.
 *
 * More to the point, it clears on the switch a new player actually makes. Boot, `K`, `1` (Aki, the
 * default), `K`, `2` (Vix) — and Sunny, Twitch, Bramble and Thornback all miss Aki, on day one, at zero
 * friendship. `succession.test.ts` recomputes both facts from `ROSTER` rather than pinning the numbers,
 * so a roster change that made this constant dormant turns the suite red instead of turning the beat off
 * quietly.
 */
export const MISS_MARGIN = 0.5;

/**
 * Hearts at which a dino misses the old watcher whatever the fit said. This is the item's own wording —
 * *a dino with high friendship under the old observer* — and it is the door a **fresh save cannot reach**.
 * It ships beside the fit door above, never instead of it.
 */
export const MISS_HEARTS = 5;

/**
 * One note per **departed** watcher id. Each names that watcher's own tell, the ones `voice.ts`
 * established, and names it as gone. Kes is again the odd one out: the others are absences of a thing a
 * dino could see or hear, and Kes's is the absence of a smell it half-recognised as kin.
 *
 * A unit test asserts there is a note for every id in `KEEPERS` and that no two plain lines match — the
 * same guard `voice.ts` carries, and the reason a fifth watcher cannot ship mute.
 */
const MISSES: Record<string, Note> = {
  aether: {
    prickly: ` …the humming one's gone, then. I'd got used to the humming. now it's you.`,
    warm: ` …oh — but where's the humming one? it used to stand just there and *hum*. I do hope it comes back.`,
    plain: ` …there was a humming one before you. it isn't humming now. I notice the quiet.`,
  },
  vanta: {
    prickly: ` …the red eye stopped looking at me. I spent a long while not liking it and now I want it back.`,
    warm: ` …the fierce one with the red eye! is it coming back? I was getting brave for it, I was.`,
    plain: ` …the one with the red eye isn't here. it never blinked. you blink.`,
  },
  lumen: {
    prickly: ` …the one that wrote me down has stopped. nobody's writing. it's worse, somehow.`,
    warm: ` …oh, the big round eye that wrote things! did it finish my page? I hope it finished my page.`,
    plain: ` …the round eye that wrote me down isn't here. I'd got used to being written down.`,
  },
  kestrel: {
    prickly: ` …the one that smelled like family went away. good. — no. no, that was a lie.`,
    warm: ` …where's my cousin gone? the one that smelled almost like us! it sat at the edge and it *listened*.`,
    plain: ` …the one that smelled almost like us isn't at the edge any more. I keep looking at the edge.`,
  },
};

/** The longest note in the table — `cannedReply`'s caps are derived from this, never typed. */
export const MISS_ASIDE_MAX = Math.max(
  ...Object.values(MISSES).flatMap((n) => [n.prickly.length, n.warm.length, n.plain.length]),
);

/**
 * Does this dino miss the watcher that left? Two independent doors, and the first needs no friendship
 * at all, which is what makes the beat reachable on a fresh save:
 *
 * - **fit** — the departed chassis suited this animal better than the incoming one, by `MISS_MARGIN`.
 * - **fondness** — it was close to you while you wore that chassis, whatever the fit said.
 *
 * `keeperFit` scores 0 for a dino with no traits, so a traitless dino falls through to the hearts door
 * alone rather than missing everyone equally.
 */
export function missesWatcher(prev: Keeper, next: Keeper, traits?: Personality, hearts = 0): boolean {
  if (hearts >= MISS_HEARTS) return true;
  return keeperFit(prev, traits) - keeperFit(next, traits) >= MISS_MARGIN;
}

/**
 * The wistful clause, temperament-shaded on the register's own convention. An unknown id (or none) adds
 * nothing at all, which is the back-compat path every save written before this cycle takes.
 */
export function missAside(prevId: string | undefined, traits?: Personality): string {
  const note = prevId ? MISSES[prevId] : undefined;
  if (!note) return '';
  if (traits && traits.agreeableness < PRICKLY_MAX) return note.prickly;
  if (traits && traits.agreeableness > EFFUSIVE_MIN) return note.warm;
  return note.plain;
}

/** Ids the register has a note for — the test's iteration target, and a fifth watcher's checklist. */
export function watchersWithMisses(): string[] {
  return Object.keys(MISSES);
}

/**
 * The line every dino files when the watcher changes — the faint "it isn't the same one" the item asks
 * for, filed through the memory ring that already exists. It rolls off the ring like everything else,
 * which is the freshness gate: the park notices, and then the park gets on with it.
 */
export function switchMemory(prev: Keeper, next: Keeper): string {
  return `the watcher changed — ${nicknameOf(prev)} left, ${nicknameOf(next)} stands there now`;
}
