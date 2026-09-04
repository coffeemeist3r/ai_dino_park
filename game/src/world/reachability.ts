/**
 * The reachability register (BACKLOG-501) — CHARTER v7's bar as a thing that breaks.
 *
 * v7 asks every track one question: *in a fresh save, watched for ten minutes, what does the player see
 * that they could not see before?* It is answered by a human writing a paragraph in a verdict. The
 * **standing** answers — the ones that make the shipping park worth booting at all — are pinned by one
 * bespoke test each, written by whoever happened to notice: the Grove's ruin (488), the two bank ledgers
 * that seat a council (492/497), the two-rate clock (493), the spread cast (486/500), the Ridge's black
 * glass (503), the one frontier (505), the founders (512). Nothing listed them together, so nothing could
 * say when one went dark — and going dark is *silent*, because a claim about the founding state is only
 * ever surfaced by moving a founding constant, which is exactly the thing v7 wants done more often.
 *
 * So the claims live here, in one list, each with the founding fact that makes it reachable and a
 * predicate that asks the same question the player's experience asks. `cycle-145-reachability.test.ts`
 * walks the list and fails naming the item and the fact, so a tuning pass that turns a system off reads
 * *"the park no longer ships X, which is what made Y reachable"* rather than an assertion diff.
 *
 * **Two rules for an entry, both learned the hard way.**
 *
 * 1. **Go through the production function that owns the fact.** `GOVERNANCE_OBSERVABLE_AT` states its own
 *    discipline — derived from the constants, never restating their values — because a claim written down
 *    twice goes stale in one of the two places (BACKLOG-495's whole thesis). An entry that hardcodes what
 *    a constant *was* is a second copy, and it will be the wrong one.
 * 2. **A dark entry is repaired, never quietly deleted.** Removing a claim to make this file green is the
 *    defect this file exists to catch, wearing the file's own uniform.
 *
 * Pure TypeScript (no Phaser), so the walk runs in Node and costs a suite nothing.
 */

import { ACTIVE_SCALE, FOUNDING_DAY, FOUNDING_HOUR, MINUTES_PER_DAY } from './clock';
import { atRest, chronotypeOf } from './chronotype';
import { seededPersonality } from '../ai/personality';
import { seasonFor, type Season } from './seasons';
import { VIGIL_ART_KEY } from './vigil';
import { MISSED_ART_KEY } from './missed'; // BACKLOG-116/531
import {
  FOUNDING_PILES,
  FOUNDING_RUIN,
  foundingCouncils,
  foundingKind,
  foundingPioneers,
  foundingResidents,
  groundsWithoutResidents,
} from './founding';
import { isUnsettled } from './frontier';
import { pileTotal, type ResourceKind } from './resource';
import { REPAIR_COST } from './upkeep';
import { quarryGround, quarryKind } from './quarry';
import { PILE_STEPS } from './bank';
import { FOODS } from './foods';
import { HATCH_ART_KEY } from './hatch';
import { STAKE_ART_KEY, STAKE_HOLLOWED_ART_KEY, STAKE_NATIVE_ART_KEY } from './stake';
import { cropOf, ripeRigKey, type CropStage } from './plot';
import { TIC_ASIDE } from './tic';
import { DOZE_ART_KEY, ROUSE_ART_KEY } from './chronotype';
import { BOWL_ID, zoneChain } from './zones';
import { PROP_RIGS } from '../art/propArt';

/** One claim the shipping park makes about itself. */
export interface ReachabilityEntry {
  /** The BACKLOG item (or items) that made the claim — the thing to go read when this goes dark. */
  id: string;
  /** What the player can see, in the bar's own register. */
  system: string;
  /** The founding fact that makes it reachable. */
  fact: string;
  /** Does it still hold? Pure, and routed through the production function that owns the fact. */
  holds: () => boolean;
}

/**
 * How long a session is, for the purpose of the clock's claim. The bar says ten minutes of *watching*; a
 * day boundary is the coarsest beat in the park, so it gets the generous reading — half an hour at a
 * keyboard. If a later tuning pass can no longer put one whole in-game day inside that, every day-boundary
 * beat in the park is back where BACKLOG-493 found it.
 */
export const SESSION_MINUTES = 30;

/** In-game minutes in a day. Local, because `clock.ts` keeps its copy private and this is arithmetic. */


/**
 * Every prop key the shipping world can put on the ground, derived from the production tables that decide
 * what gets placed rather than typed out as a list.
 *
 * This is the other half of entry 9. `PROP_RIGS` says what has been *drawn*; this says what can be *seen*,
 * and the cycle-91 stash rule means the two are allowed to disagree for a while — a rig may be authored
 * ahead of the system that displays it. What the stash rule never came with is a deadline, so a stashed rig
 * can sit undisplayed for as long as nobody counts. This counts.
 */
export function worldPlacedProps(): Set<string> {
  const out = new Set<string>();
  // Loose resources (285/328/400/503) — `RESOURCE_GLYPH`'s kinds, one sprite per ground.
  const kinds: ResourceKind[] = ['branch', 'stone', 'frond', 'obsidian'];
  for (const k of kinds) out.add(k);
  // Landmarks and their ruins (494) — `<name>` and `<name>_derelict`, by convention in `applyObjectVisibility`.
  for (const l of ['cairn', 'shelter', 'thatch', 'granary']) {
    out.add(l);
    out.add(`${l}_derelict`);
  }
  out.add('beacon'); // 503 — the Ridge's landmark, drawn but never derelict
  // The plot's stages (145/349/434) — `crop_<stage>`, and one ripe rig per zone crop.
  const stages: CropStage[] = ['seed', 'sprout', 'ripe'];
  for (const s of stages) out.add(`crop_${s}`);
  for (const z of zoneChain()) out.add(ripeRigKey(cropOf(z).food));
  // Every food the hatch can drop (490) — `food_<id>`.
  for (const f of FOODS) out.add(`food_${f.id}`);
  // The ritual's worn ground (496/507) — `tic_<kind>`.
  for (const k of Object.keys(TIC_ASIDE)) out.add(`tic_${k}`);
  // The ground's banked heap (504/506) — one key per step above zero.
  for (let i = 1; i <= PILE_STEPS.length; i++) out.add(`pile_${i}`);
  out.add(HATCH_ART_KEY); // 510
  out.add('egg'); // 491
  // BACKLOG-501's own repair: the founder's mark, in both its states (513/514), planted by `stake.ts`.
  out.add(STAKE_ART_KEY);
  out.add(STAKE_NATIVE_ART_KEY); // 517, wired the night it was drawn
  out.add(STAKE_HOLLOWED_ART_KEY);
  // BACKLOG-520/109: the two hour-marks, hung over a dino rather than laid on the ground — placed by
  // `refreshSleepMarks` / `refreshRouseMarks`, which is why they count as seen.
  out.add(DOZE_ART_KEY);
  out.add(ROUSE_ART_KEY);
  // BACKLOG-121/526: the vigil mark, hung over the dino standing at the glass by `refreshVigilMarks`.
  out.add(VIGIL_ART_KEY);
  // BACKLOG-116/531: the missed-you thought, hung over a dino that formed an account of the keeper's
  // absence by `refreshMissedMarks`. Fourth of the family, and the same reason it counts: the scene hangs
  // it over a dino rather than laying it on the ground, but a player sees it either way.
  out.add(MISSED_ART_KEY);
  return out;
}

/**
 * Is the founding cast **split** at this hour — at least one resident down and at least one up
 * (BACKLOG-523)?
 *
 * This is the claim the opening hour never had. `FOUNDING_HOUR` was a field initialiser: written once,
 * derived from nothing, pinned by nothing, and quietly the number every day-shaped read in Milestone 17 is
 * measured from. Moved four hours either way, the whole milestone's frame-one read goes dark — one
 * direction wakes the entire cast, the other puts all of it down — and every gate in this studio stays
 * green. So the constant gets a predicate rather than a nicer name.
 *
 * The hour is a **parameter**, not the constant, which is what lets a test move it and watch this go false
 * without editing production. Routed through `foundingResidents` / `chronotypeOf` / `atRest`, per rule 1 of
 * this file's header: the production functions own the fact, and nothing here restates an hour.
 */
export function castSplitAt(hour: number, season: Season = seasonFor(FOUNDING_DAY)): boolean {
  const names = Object.values(foundingResidents()).flat();
  let up = 0;
  let down = 0;
  for (const name of names) {
    if (atRest(hour, chronotypeOf(seededPersonality(name)), season)) down++;
    else up++;
  }
  return up > 0 && down > 0;
}

/**
 * Which residents of a ground are up at this hour (BACKLOG-121) — the founding-state twin of the read the
 * scene runs live, and the whole of the vigil's chronotype logic. Nothing here mentions a chronotype by
 * name; the owl falls out of the hour, which is the arc's entire point.
 */
export function wakingAt(hour: number, zone: string, season: Season = seasonFor(FOUNDING_DAY)): string[] {
  return (foundingResidents()[zone] ?? []).filter(
    (name) => !atRest(hour, chronotypeOf(seededPersonality(name)), season),
  );
}

/**
 * The register. Ordered oldest claim first, which is also roughly the order a player meets them.
 */
export const REACHABILITY_REGISTER: ReachabilityEntry[] = [
  {
    id: 'BACKLOG-486/500',
    system: 'every ground you can walk to has somebody living on it',
    fact: 'the roster carries a spawn zone, and at most one ground in the chain wakes empty',
    holds: () => groundsWithoutResidents().length <= 1,
  },
  {
    id: 'BACKLOG-488',
    system: 'a broken landmark, and somebody who walks over and mends it',
    fact: 'the Grove ships a fallen cairn and a pile that covers REPAIR_COST, and residents to spend it',
    holds: () =>
      (foundingResidents()[FOUNDING_RUIN.zone] ?? []).length > 0 &&
      pileTotal(FOUNDING_PILES[FOUNDING_RUIN.zone] ?? {}) >= REPAIR_COST,
  },
  {
    id: 'BACKLOG-492/497',
    system: 'a vote with something to count, rather than one dino wearing a council badge',
    fact: 'a founding ledger seats two on at least one ground',
    holds: () => Object.values(foundingCouncils()).some((seats) => seats.length >= 2),
  },
  {
    id: 'BACKLOG-493',
    system: 'a day boundary — upkeep, spoilage, a term, the crops — inside one sitting',
    fact: 'the watched clock runs fast enough to put a whole in-game day inside a session',
    holds: () => MINUTES_PER_DAY / ACTIVE_SCALE <= SESSION_MINUTES,
  },
  {
    id: 'BACKLOG-503',
    system: 'one thing that exists on the Ridge and nowhere else, worth a climb',
    fact: 'a ground holds an exclusive kind, and somebody lives there to find it',
    holds: () => {
      const ground = quarryGround();
      return !!ground && !!quarryKind() && (foundingResidents()[ground] ?? []).length > 0;
    },
  },
  {
    id: 'BACKLOG-505',
    system: 'a frontier badge that means something — one ground nobody has settled',
    fact: 'exactly one ground in the chain reads unsettled on a fresh save',
    holds: () => {
      const founders = foundingPioneers();
      const residents = foundingResidents();
      const unsettled = zoneChain().filter((z) =>
        isUnsettled((residents[z] ?? []).length, founders[z]),
      );
      return unsettled.length === 1;
    },
  },
  {
    id: 'BACKLOG-512',
    system: 'the collection book names who founded each ground, on the first frame',
    fact: 'every ground the roster wakes on records a founder, and the frontier records none',
    holds: () => {
      const founders = foundingPioneers();
      return Object.entries(foundingResidents()).every(
        ([z, names]) => (founders[z] !== undefined) === names.length > 0,
      );
    },
  },
  {
    id: 'BACKLOG-516',
    system: 'and says whether they were born there or walked in',
    fact: 'the founding grounds all read born, and a crossing into the frontier still reads crossed',
    holds: () => {
      const founders = foundingPioneers();
      const born = Object.keys(founders).every((z) => foundingKind(founders, z) === 'born');
      const frontier = zoneChain().find((z) => founders[z] === undefined);
      return born && !!frontier && foundingKind({ ...founders, [frontier]: 'Twitch' }, frontier) === 'crossed';
    },
  },
  {
    id: 'BACKLOG-523',
    system: 'the park opens on an hour where its cast is split — somebody up, somebody down',
    fact: 'the founding hour falls inside some residents’ rest window and outside others’',
    holds: () => castSplitAt(FOUNDING_HOUR),
  },
  {
    id: 'BACKLOG-121',
    system: 'somebody is already waiting at the hatch when you open the park',
    fact: 'the founding hour leaves at least one resident of the hatch’s ground awake to keep the vigil',
    holds: () => wakingAt(FOUNDING_HOUR, BOWL_ID).length > 0,
  },
  {
    id: 'BACKLOG-501',
    system: 'every rig the studio has drawn is a rig the park can actually put on the ground',
    fact: 'the cycle-91 stash rule lets a rig be authored ahead of its host; nothing counted the ones still waiting',
    holds: () => unplacedRigs().length === 0,
  },
];

/** Drawn but unplaceable — the rigs `PROP_RIGS` holds that the shipping world has no way to show. */
export function unplacedRigs(): string[] {
  const placed = worldPlacedProps();
  return Object.keys(PROP_RIGS).filter((k) => !placed.has(k));
}

/** The claims that no longer hold. Empty is the only shipping state. */
export function darkEntries(): ReachabilityEntry[] {
  return REACHABILITY_REGISTER.filter((e) => !e.holds());
}
