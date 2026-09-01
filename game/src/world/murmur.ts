/**
 * Sleep murmurs (BACKLOG-181) — the den dreams. A huddled dino occasionally murmurs a quiet 💭 sleep-line
 * drawn from its strongest memory of the day, so the night becomes a place where each dino's day echoes
 * back in its own half-formed thought (distinctness in the overheard-dream register).
 *
 * Pure TypeScript (no Phaser, no AI backend — the `NPCBrain` boundary stays intact): Node-testable. This
 * is the deterministic core; an LLM-coloured murmur could layer on later behind `brain.ts` (181 follow-ups).
 *
 * **BACKLOG-307 — what a dino dreams when it has had no day yet.** 181's answer was `…zzz…`, one string for
 * everybody, which on a fresh save is every sleeper in the park saying the same thing in the one feature
 * whose stated job is a personality tell. So a memoryless sleeper dreams off its *signature axis* instead:
 * the trait it is furthest from neutral on, the same rule the idle fidget (298) and the ritual (405) pick
 * by. The rule is imported from `tic.ts` rather than written a third time; the word table is this module's
 * own, because a dream and an idle quirk are different registers and sharing one table would tie two
 * unrelated readouts together.
 */

import { signatureAxis } from './tic';
import type { Personality } from '../ai/personality';

/**
 * One dream per pole of the five axes. Single lowercase words on purpose — a dream is a fragment, not a
 * sentence, and the bubble is read at a glance from across the field. All ten are distinct: two dinos that
 * dream the same word would have to share an axis *and* a pole, which is the only sameness this table allows.
 */
export const DREAM_BY_AXIS: Record<keyof Personality, { low: string; high: string }> = {
  curiosity: { high: 'elsewhere', low: 'home' },
  sociability: { high: 'company', low: 'quiet' },
  energy: { high: 'running', low: 'warmth' },
  agreeableness: { high: 'sharing', low: 'nobody' },
  bravery: { high: 'thunder', low: 'hiding' },
};

/**
 * What this dino dreams with nothing to dream about — the pole of its signature axis. At/above 0.5 takes the
 * high pole, matching `fidget()`'s convention exactly so a dino's dream and its idle quirk never disagree
 * about which half of itself it is on.
 */
export function dreamWord(p: Personality): string {
  const axis = signatureAxis(p);
  const pole = DREAM_BY_AXIS[axis];
  return p[axis] >= 0.5 ? pole.high : pole.low;
}

/** The collection-book line (BACKLOG-307) — wording owned here beside the word, per `ticBookLine`. */
export function dreamBookLine(p: Personality): string {
  return `💭 dreams of ${dreamWord(p)}`;
}

/** The day's strongest memory to dream on — the most recent entry, or null when the dino has none yet. */
export function pickMurmurMemory(events: string[]): string | null {
  return events.length ? events[events.length - 1] : null;
}

/**
 * A 💭 sleep-line from a memory. A logged memory often leads with an event glyph ("🍖 ate its favorite");
 * strip that so the dream reads as a drowsy fragment, not a copied log line.
 *
 * No memory → the dino's trait dream (BACKLOG-307), or the generic doze when no traits are supplied. The
 * `traits` argument is optional so every pre-307 caller and spec is byte-identical: the memory branch is
 * untouched, and a memoryless call without traits still returns `…zzz…`.
 */
export function murmurLine(memory: string | null, traits?: Personality): string {
  if (!memory) return traits ? `💭 …${dreamWord(traits)}…` : '💭 …zzz…';
  const frag = memory.replace(/^[^A-Za-z0-9]+/, '').trim();
  return `💭 …${frag}…`;
}
