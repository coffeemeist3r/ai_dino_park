/**
 * The relation register (BACKLOG-521) — the claims the park's constants make about each other, as things
 * that break.
 *
 * Three weeks ago `WORK_BUILD_FLOOR` was the literal `6`, under a comment saying it was set *above the
 * cairn recipe and below the granary's, so a gather-first ground visibly banks a while and still builds.*
 * BACKLOG-509 raised a cairn from 5 to 6. From that instant no affordable pile could be below the floor, so
 * a gather-first ground never deferred a build again and the whole stores-before-walls work policy — a
 * governance choice the player makes, with a lens glyph and a persisted setting — was dormant. The build
 * was clean. Every one of 2310 unit tests was green. The comment went on describing a relationship that had
 * stopped being true, because comments do not fail.
 *
 * That is CHARTER v7's failure mode arriving by a route v7 does not describe. v7 catches a constant *tuned*
 * to be dormant, and the Validator catches it by asking what a player can reach. This is a constant *made*
 * dormant by a change on the other side of the park, in a system that had nothing to do with it, and there
 * is no verdict question that finds it — the only witness was an e2e spec that happened to *use* the
 * deferral, and it surfaced a cycle later as a confusing off-by-one about cairn counts.
 *
 * So the claims live here, one entry per relation, each with the claim in words and a predicate that reads
 * **both ends through the modules that own them**. `relations.test.ts` walks the list and fails naming the
 * claim, so a tuning pass that breaks one reads *"`TRACE_FRESH_STEPS` no longer covers two solitary
 * stretches"* rather than an assertion diff four modules away.
 *
 * **Two rules for an entry, inherited from `reachability.ts` (BACKLOG-501) and true for the same reasons.**
 *
 * 1. **Go through the module that owns the constant.** Never restate a value. An entry that hardcodes what
 *    a constant *was* is a second copy, and it will be the wrong one — which is precisely the defect this
 *    register exists to catch, so an entry that commits it is worse than no entry. The one literal an entry
 *    may carry is the relation's *own* tuning knob (a multiplier, a margin), and it must say so.
 * 2. **A broken relation is repaired, never quietly deleted.** Removing a claim to make this file green is
 *    the defect wearing the file's own uniform.
 *
 * The comments that named a relation *and* wrote its other end down again — `below STOCKPILE_SOFT_CAP (6)`,
 * `below LONER_FLOOR (8)` — have had the restatement removed as part of this fire. The relation is here now.
 *
 * Pure TypeScript (no Phaser), so the walk runs in Node and costs the suite nothing.
 */

import { WORK_BUILD_FLOOR } from './governance';
import { PILE_STEPS, pileStep } from './bank';
import { STOCKPILE_SOFT_CAP, structureRecipe, pileTotal } from './resource';
import { FETCH_BOND_FLOOR } from './fetch';
import { LONER_FLOOR } from './loner';
import { HUDDLE_THRESHOLD } from './huddle';
import { TRACE_FRESH_STEPS } from './traces';
import { TIC_AFTER_STEPS, TIC_AFTER_STEPS_HOMESICK, TIC_AFTER_STEPS_STUNG } from './tic';
import { SPOIL_MARGIN, spoilsAtCap } from './spoilage';
import { FOOD_STOCKPILE_CAP } from './foodstore';
import { GRANARY_FOOD_BONUS } from './granary';
import { NEED_THRESHOLD, STARVING } from './needs';
import { FOUNDING_PILES, FOUNDING_RUIN } from './founding';
import { REPAIR_COST } from './upkeep';
import { chronotypeOf, owlishness, OWL_BAR } from './chronotype';
import { seededPersonality } from '../ai/personality';
import { ROSTER } from '../entities/roster';

/** One claim a constant makes about another constant. */
export interface RelationEntry {
  /** The BACKLOG item (or items) the relation belongs to — what to go read when it breaks. */
  id: string;
  /** The claim, in the words the source comment makes it in — this is what a failure prints. */
  claim: string;
  /** Does it still hold? Both ends read from the owning module; no copied values. */
  holds: () => boolean;
}

/**
 * How far a trace's freshness window must stretch relative to the solitude that makes the mark.
 * `traces.ts` states this as "≈ 2×" and it is that module's calibration knob, so the multiplier is the one
 * literal this file is allowed to carry (rule 1's stated exception).
 */
const TRACE_STRETCH = 2;

/**
 * How far every roster name must clear the owl bar. `chronotype.ts` states this as "~0.05 on both sides"
 * and gives the number as its reason for rejecting a simpler rule, so it is that module's calibration knob
 * and the second literal this file is allowed to carry.
 */
const OWL_MARGIN = 0.05;

/**
 * Ordered roughly by how load-bearing the relation is — the one that has already gone false once first.
 */
export const RELATION_REGISTER: RelationEntry[] = [
  {
    id: 'BACKLOG-509/521',
    claim:
      'the work-build floor sits above a default landmark’s own cost, so a gather-first ground banks a while before it builds — below it, no affordable pile can ever be under the floor and the stores-before-walls policy never defers anything',
    holds: () => {
      const recipe = Object.values(structureRecipe()).reduce((t: number, n) => t + (n ?? 0), 0);
      return WORK_BUILD_FLOOR > recipe;
    },
  },
  {
    id: 'BACKLOG-429/509/521',
    claim:
      'the per-ground soft cap is never below the work-build floor — below it, a gather-first ground cannot reach the total it needs to build without already being glutted, so it sheds the last unit to a lighter neighbour every time it gets there and "stores before walls" never ends in a wall',
    holds: () => STOCKPILE_SOFT_CAP >= WORK_BUILD_FLOOR,
  },
  {
    id: 'BACKLOG-504/506',
    claim:
      'the heap’s top step sits below the per-ground soft cap, so a well-gathered ground actually reaches its full heap instead of shedding one step short of it',
    holds: () => PILE_STEPS[PILE_STEPS.length - 1] < STOCKPILE_SOFT_CAP,
  },
  {
    id: 'BACKLOG-488/504',
    claim:
      'the Grove’s founding pile covers the founding ruin’s mend with a unit to spare, and reads as a standing heap the moment a new player walks one edge east — so the first structure they meet is broken, somebody fixes it, and the heap visibly steps down for it',
    holds: () => {
      const pile = FOUNDING_PILES[FOUNDING_RUIN.zone] ?? {};
      const total = pileTotal(pile);
      return total > REPAIR_COST && pileStep(total) > pileStep(total - REPAIR_COST);
    },
  },
  {
    id: 'BACKLOG-109',
    claim:
      'every roster name clears the owl bar by a real margin — the weights were chosen over a simpler rule precisely because that one put a founding dino within a thousandth of the line, so a trait tweak must not be able to flip anybody’s schedule by accident',
    holds: () =>
      ROSTER.every((r) => Math.abs(owlishness(seededPersonality(r.name)) - OWL_BAR) >= OWL_MARGIN),
  },
  {
    id: 'BACKLOG-109/486',
    claim:
      'the roster is not one shift — the founding cast holds both an owl and a day-dino, or the whole two-hours park is a park where everybody still sleeps together',
    holds: () => {
      const kinds = new Set(ROSTER.map((r) => chronotypeOf(seededPersonality(r.name))));
      return kinds.has('owl') && kinds.has('day');
    },
  },
  {
    id: 'BACKLOG-381',
    claim:
      'the fetch bond floor sits strictly below the loner floor — a loner’s every bond is below the loner floor by definition, so at or above it nobody could ever come for one and the whole beat is unreachable',
    holds: () => FETCH_BOND_FLOOR < LONER_FLOOR,
  },
  {
    id: 'BACKLOG-381/171',
    claim: 'the fetch bond floor is at most half a huddle — the peer who comes is not a close friend',
    holds: () => FETCH_BOND_FLOOR <= HUDDLE_THRESHOLD / 2,
  },
  {
    id: 'BACKLOG-405/411',
    claim:
      'a scuffed spot stays worth noticing for at least twice the solitude it took to make it, so a wanderer plausibly crosses one before it goes stale',
    holds: () => TRACE_FRESH_STEPS >= TIC_AFTER_STEPS * TRACE_STRETCH,
  },
  {
    id: 'BACKLOG-393/096/scarcity',
    claim:
      'the ritual’s two shorteners are strictly shorter than the ordinary solitary stretch, and a fresh sting reads faster than unfamiliar ground: stung < homesick < ordinary',
    holds: () => TIC_AFTER_STEPS_STUNG < TIC_AFTER_STEPS_HOMESICK && TIC_AFTER_STEPS_HOMESICK < TIC_AFTER_STEPS,
  },
  {
    id: 'BACKLOG-446/461',
    claim:
      'a hoarded food pile bleeds down and then stops — it settles at one below the near-cap band and no lower, so spoilage never empties a store it was only meant to trim',
    holds: () => {
      // Rule 1: assert the behaviour through the production function rather than restating its arithmetic.
      let n = FOOD_STOCKPILE_CAP;
      for (let i = 0; i < FOOD_STOCKPILE_CAP + 2 && spoilsAtCap(n, FOOD_STOCKPILE_CAP); i++) n--;
      return !spoilsAtCap(n, FOOD_STOCKPILE_CAP) && n === FOOD_STOCKPILE_CAP - SPOIL_MARGIN - 1 && n > 0;
    },
  },
  {
    id: 'BACKLOG-454',
    claim:
      'a standing granary lifts its ground’s per-food cap above the flat one — a granary that lifts nothing is a structure with no effect, which is the dormancy this register exists for',
    holds: () => GRANARY_FOOD_BONUS > 0 && FOOD_STOCKPILE_CAP + GRANARY_FOOD_BONUS > FOOD_STOCKPILE_CAP,
  },
  {
    id: 'BACKLOG-444/371',
    claim:
      'the starving bar sits well above the pressing-need bar, so the 0.6–0.9 band stays open — a dino wears the 🍖 and leans toward the hatch *without* the pantry bailing it out; close the band and every Milestone 5 beat stops being reachable',
    holds: () => STARVING > NEED_THRESHOLD && STARVING - NEED_THRESHOLD >= 0.2,
  },
];

/** The relations that no longer hold. Empty is the only shipping state. */
export function brokenRelations(): RelationEntry[] {
  return RELATION_REGISTER.filter((e) => !e.holds());
}
