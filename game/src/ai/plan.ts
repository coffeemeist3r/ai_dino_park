/**
 * Persona-shaped daily plan (BACKLOG-012) — the day's lean given a shape.
 *
 * BACKLOG-393 gave each dino ONE intent for the whole day; the plan gives the day an arc: one
 * intent kind per day-phase (dawn/day/dusk/night), so the lean that nudges what a dino does
 * *changes as the day turns* — a dawn forager drifts to company by midday and keeps to itself at
 * night. Deterministic and trait-weighted per phase (same weight table as the whole-day intent),
 * recomputed each in-game day from name+day+traits — no persistence, so a phone loading a save
 * pays nothing and the sim is whole with zero model. WorldScene derives the *current* phase's
 * DinoIntent from the plan and feeds it to the existing, unchanged step-loop nudges.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable.
 */

import { hashSeed, mulberry32, type Personality } from './personality';
import { INTENT_NOTES, pickKind, type DinoIntent, type IntentKind } from './intent';
import { type DayPhase } from '../world/dayNight';

/** A lean per day-phase — the shape of the dino's day. */
export type DayPlan = Record<DayPhase, IntentKind>;

/** Fixed iteration/render order: the day as it's lived. */
export const DAY_PHASES: readonly DayPhase[] = ['dawn', 'day', 'dusk', 'night'];

/** Short word per kind for the book's plan shape (mirrors INTENT_NOTES, but one word). */
const SHAPE_WORD: Record<IntentKind, string> = {
  social: 'social',
  solitary: 'solitary',
  forage: 'forage',
  restless: 'rest',
};

/**
 * The seeded procedural author — the deterministic floor. Same (name, day) → same plan, always.
 * Each phase gets its own seed so the lean can differ across the day while staying in character
 * (the trait weighting is identical to the whole-day intent's — one table via pickKind).
 */
export function proceduralPlan(name: string, day: number, traits: Personality): DayPlan {
  const plan = {} as DayPlan;
  for (const phase of DAY_PHASES) {
    plan[phase] = pickKind(mulberry32(hashSeed(`${name}#plan#${day}#${phase}`)), traits);
  }
  return plan;
}

/**
 * The DinoIntent for the current phase — what the step-loop nudges consume. Note is the
 * deterministic floor note; WorldScene lets a brain color it in place (BACKLOG-393 shape).
 */
export function activeIntent(plan: DayPlan, phase: DayPhase, day: number): DinoIntent {
  const kind = plan[phase];
  return { kind, note: INTENT_NOTES[kind], until: day };
}

/** The whole day as one legible line for the collection book, dawn→day→dusk→night. */
export function planShape(plan: DayPlan): string {
  return DAY_PHASES.map((p) => SHAPE_WORD[plan[p]]).join(' → ');
}
