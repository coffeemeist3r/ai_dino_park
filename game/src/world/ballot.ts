/**
 * A vote that answers to a history (BACKLOG-492).
 *
 * Since 487 a ground's **both** calls belong to its council, and every seat casts its ballot by reading a
 * hard threshold off a single **name-seeded** axis: `providerPriority` asks `agreeableness >= 0.5`,
 * `providerWorkPriority` asks `energy >= 0.5`. Those numbers are fixed at the instant the dino was named and
 * are touched by no ledger this park keeps. A ground can starve for a season, watch its granary come down and
 * reseat three times over, and its politics are exactly the arithmetic of five birth-numbers — 484's term is
 * a calendar over a constant, and 485's bill has to *override* the vote precisely because it cannot
 * *persuade* it.
 *
 * So a seat's ballot gets shaded by what that seat has **lived on the ground it sits for**: its own hunger
 * (371), its share of what the ground has banked (448), and whether the reserve has refused one of its
 * ground's mouths (471). A bounded nudge across the line, never a replacement for the trait — the same
 * capped-drift shape 043/187 use to shade a personality, applied to a decision.
 *
 * **The temperament stays the floor.** `LIVED_NUDGE_CAP` is small enough that a decided dino is unturnable:
 * Bramble votes warm at 0.87 and Rex votes prickly at 0.019 whatever either of them lives through. What a
 * life can move is a seat sitting *near* the line — which is the whole design, and which is why the founding
 * park (`founding.ts`) deliberately seats one.
 *
 * **The derelict term is deliberately absent, and this is a finding rather than an omission.** 492's own
 * text asks for "whether it stood in a zone whose landmark came down (480)" to shade the vote. It cannot:
 * 485's `calledWork` already replaces the labour call outright with `'gather'` for as long as anything on
 * that ground is derelict, so a derelict weight here could only ever fire in the exact states where its
 * result is guaranteed to be discarded — a constant with a unit test and no reachable effect, which is the
 * thing CHARTER v7 now calls a defect. Do not "restore" it without first retiring the bill's override.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene owns the three reads that fill a `SeatExperience`.
 */

import type { Personality } from '../ai/personality';
import { providerPriority, providerWorkPriority, type SpendPriority, type WorkPriority } from './governance';

/** What one seat has lived, on the one ground it sits for. Every field is a read that already existed. */
export interface SeatExperience {
  /** This seat's own hunger, 0 sated .. 1 starving (371). */
  hunger: number;
  /** Has the bank reserve refused one of this ground's starving mouths (471)? */
  heldShort: boolean;
  /**
   * This seat's stake in the pile (448), measured **against an even split**: its fraction of everything its
   * ground's residents have banked, minus `1 / residents`. So `0` is a dino pulling its weight, `+` is one
   * carrying the ground, `-` is one carried by it, and the range is `[-1, 1]`.
   *
   * Relative and not absolute, because the absolute read made the term a constant rather than a history: the
   * ordinary case in this park is a ground where exactly one dino has banked anything, which gives that dino
   * a raw share of 1.0 and therefore the maximum possible nudge for free, on every ground, forever. A stake
   * is only news when it is out of proportion to the company you keep.
   */
  stake: number;
}

/** The whole shift a life can be worth, either way. Small on purpose: see the header. */
export const LIVED_NUDGE_CAP = 0.2;

/** A seat's own hunger. The heaviest single term — the one thing a seat feels rather than infers. */
export const HUNGER_WEIGHT = 0.3;
/** Its ground having been refused. Lighter than hunger: a grievance on behalf of somebody else. */
export const SHORT_WEIGHT = 0.15;
/** Its stake in the pile, over or under an even split. The only term that pulls the *other* way on the
 *  pantry call, and the only one that can be negative. */
export const STAKE_WEIGHT = 0.2;

export type BallotCall = 'pantry' | 'labour';

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/**
 * How far this seat's life moves its ballot, on the axis that call reads. Positive is toward the *high* end
 * of the axis — `feed` on the pantry call (agreeableness), `build` on the labour call (energy).
 *
 * Pantry: a seat that is hungry, or sits for a ground the reserve has refused, leans to feeding; a seat that
 * put most of the pile there leans to protecting it. Labour is the mirror: a hungry seat wants backs on the
 * gathering, and the seat that filled the pile wants the pile to become something.
 *
 * `undefined` — an unlived seat — is exactly 0, which is the compatibility seam every function below honours.
 */
export function livedShift(lived: SeatExperience | undefined, call: BallotCall): number {
  if (!lived) return 0;
  const hunger = clamp(lived.hunger, 0, 1);
  const stake = clamp(lived.stake, -1, 1);
  const raw =
    call === 'pantry'
      ? HUNGER_WEIGHT * hunger + (lived.heldShort ? SHORT_WEIGHT : 0) - STAKE_WEIGHT * stake
      : -HUNGER_WEIGHT * hunger + STAKE_WEIGHT * stake;
  return clamp(raw, -LIVED_NUDGE_CAP, LIVED_NUDGE_CAP);
}

/** Which axis a call is decided on — the one place the pairing is written down. */
const AXIS_FOR: Record<BallotCall, keyof Personality> = { pantry: 'agreeableness', labour: 'energy' };

/**
 * The traits a seat actually votes with: its own, with the one axis its call reads shaded by its life and
 * clamped back into `[0, 1]`. `undefined` traits stay `undefined` so the threshold functions reach their own
 * documented absent-trait defaults rather than a synthesised neutral dino.
 */
export function shadedTraits(
  traits: Personality | undefined,
  lived: SeatExperience | undefined,
  call: BallotCall,
): Personality | undefined {
  if (!traits) return undefined;
  const shift = livedShift(lived, call);
  if (shift === 0) return traits;
  const axis = AXIS_FOR[call];
  return { ...traits, [axis]: clamp(traits[axis] + shift, 0, 1) };
}

/**
 * The pantry ballot this seat casts. **Calls** `providerPriority` on the shaded traits rather than restating
 * its threshold — the 420 seam ("the old path *is* the old function"), which is what keeps every 463/487 spec
 * green by construction and what stops a second copy of `>= 0.5` existing to drift from the first.
 */
export function votedSpend(traits?: Personality, lived?: SeatExperience): SpendPriority {
  return providerPriority(shadedTraits(traits, lived, 'pantry'));
}

/** The labour ballot, the same way over `providerWorkPriority` (473/481). */
export function votedWork(traits?: Personality, lived?: SeatExperience): WorkPriority {
  return providerWorkPriority(shadedTraits(traits, lived, 'labour'));
}
