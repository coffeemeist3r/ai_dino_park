/**
 * Missed-you memory (BACKLOG-116) — five accounts of the same absence.
 *
 * The park has had an offline catch-up since cycle 29. What it does with a gap is print a digest paragraph
 * and hand *one* dino a welcome-back (`homecoming.ts`, 112). The other residents lived through the same
 * absence and the park has them say and do nothing about it: one system, five identical outputs, which is
 * the sameness the CHARTER's Living-minds line calls a defect.
 *
 * So every resident forms its own account of the gap, and the grade is a fact about that dino:
 *
 * - **missed** — it noticed and it says so.
 * - **aloof** — it noticed and will not give you the satisfaction.
 * - **unmoved** — it did not register that you were gone at all. No mark, no line, nothing.
 *
 * **The third grade is the read.** The empty space over one dino's head, beside two neighbours wearing
 * marks, says more about who those three are than any line of dialogue does — which is why `missedYou`
 * omits `unmoved` from its map entirely rather than returning it as a value a consumer has to remember to
 * filter for.
 *
 * ## Two axes, not one
 *
 * Grading on a single warmth score was the obvious shape and it is wrong: it collapses *did not care* and
 * *cared and will not say* into the same dino, and those two are the most different residents in the bowl.
 * So the read is in two independent halves — **did it notice** (sociability and curiosity: the dino that
 * registers an absence is the one that was looking at you in the first place), and then, only for those who
 * did, **will it admit it** (agreeableness, lifted by how far you have actually got with it). The hearts
 * term is the progression: befriend an aloof dino far enough and it stops pretending.
 *
 * Pure TypeScript: no Phaser, no clock, no `Date`, no randomness, and no dino's name anywhere in this file.
 * The traits are name-seeded (`ai/personality.ts`), so the grades are re-derived on every load and nothing
 * about them is written to the save.
 */

import type { Personality } from '../ai/personality';

export type MissedGrade = 'missed' | 'aloof' | 'unmoved';

/**
 * The gap at which a dino keeps a trace, in in-game minutes.
 *
 * **Deliberately not `HOMECOMING_MIN_MINUTES` (360).** The catch-up runs at `AWAY_SCALE`, so in-game
 * minutes here are real minutes: the nuzzle wants six real hours away, which is a beat that cannot happen
 * inside the ten-minute window CHARTER v7 measures a cycle against. This trace is fainter and should be far
 * commoner than the nuzzle — step away for five minutes and the bowl noticed. A threshold tuned so the
 * shipping park sits under it is the defect v7's corollary names, and inheriting 360 here would have been
 * exactly that, in the one cycle whose whole subject is the absence.
 */
export const MISSED_MIN_MINUTES = 5;

/**
 * Did it notice at all — sociability mostly, curiosity partly. The weights, and the bar, were fitted against
 * the shipping roster rather than picked: at `NOTICE_BAR` the ten founding residents clear or miss it by at
 * least 0.034 apiece, and the Bowl's five split three-noticing / two-not, which is what makes all three
 * grades visible on the first frame of a fresh save. A bar of 0.50 was the first draft and was moved up: it
 * left one resident 0.023 from the line, so a single trait tweak anywhere would have flipped a founding
 * dino's grade. `chronotype.ts` fitted `OWL_BAR` the same way and for the same reason.
 */
export const NOTICE_SOCIABILITY = 0.6;
export const NOTICE_CURIOSITY = 0.4;
export const NOTICE_BAR = 0.52;

/**
 * Will it admit it. Agreeableness, lifted by hearts (0..10). At `HEART_LIFT` the bowl's two aloof founders
 * cross at five and nine hearts respectively — both reachable, and the difference between them is a
 * character read the player earns rather than one the park states.
 */
export const WARM_BAR = 0.45;
export const HEART_LIFT = 0.05;

/** The mark a dino wears on the keeper's return, and the rig key BACKLOG-531 draws it against. */
export const MISSED_GLYPH = '💭';
export const MISSED_ART_KEY = 'missed';

/**
 * How long an unspoken thought stays over a dino's head, in world steps. Sized so the mark is a *reason to
 * walk over* rather than scenery: long enough to cross the bowl at a stroll, short enough that a keeper who
 * ignores it finds the park has moved on — which is the same bargain `companyTraceIsFresh` strikes.
 */
export const MISSED_MARK_STEPS = 40;

/** The `aloof` step of the same glyph: it is thinking about you and would rather you did not notice. */
export const MISSED_FAINT_ALPHA = 0.45;

/** How much it was looking at you in the first place, 0..1. */
export function noticing(p: Personality): number {
  return p.sociability * NOTICE_SOCIABILITY + p.curiosity * NOTICE_CURIOSITY;
}

/** This dino's account of an absence. Pure in its two inputs; the gap length is the caller's gate. */
export function missedGrade(p: Personality, hearts: number): MissedGrade {
  if (noticing(p) < NOTICE_BAR) return 'unmoved';
  return p.agreeableness + hearts * HEART_LIFT >= WARM_BAR ? 'missed' : 'aloof';
}

/**
 * The memory this grade files. One exported builder per beat rather than a template literal at the call
 * site — BACKLOG-483's finding: a string two modules read back out is one thing, so it lives in one place.
 * `unmoved` files nothing, because it has nothing to remember.
 */
export function missedMemory(grade: MissedGrade): string | null {
  if (grade === 'missed') return `${MISSED_GLYPH} noticed the keeper was gone, and minded`;
  if (grade === 'aloof') return `${MISSED_GLYPH} noticed the keeper was gone, and said nothing about it`;
  return null;
}

/** The frame this grade leads its next greeting with. Deterministic — no model is ever asked to be wistful. */
export function missedOpener(grade: MissedGrade): string | null {
  if (grade === 'missed') return `${MISSED_GLYPH} Oh — you came back!`;
  if (grade === 'aloof') return `${MISSED_GLYPH} Hm. Hadn't noticed you'd gone.`;
  return null;
}

export interface MissedInput {
  name: string;
  traits: Personality;
  hearts: number;
}

/**
 * Grade a whole cast against an absence. Empty below the threshold, and `unmoved` residents are absent from
 * the map rather than present with a grade — see the header: the absence is the beat.
 */
export function missedYou(cast: readonly MissedInput[], minutes: number): Record<string, MissedGrade> {
  if (minutes < MISSED_MIN_MINUTES) return {};
  const out: Record<string, MissedGrade> = {};
  for (const d of cast) {
    const grade = missedGrade(d.traits, d.hearts);
    if (grade !== 'unmoved') out[d.name] = grade;
  }
  return out;
}
