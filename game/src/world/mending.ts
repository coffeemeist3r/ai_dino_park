/**
 * Hands on the derelict (BACKLOG-488) — the first time in this park's life that a building is mended by
 * somebody.
 *
 * 480 gave a landmark a running cost and disrepair a reversible cure, and the cure was arithmetic:
 * `runUpkeep` flipped the oldest derelict flag the instant the ground's pile could spare `REPAIR_COST`,
 * with no dino anywhere near it. Every other economy in this park is *performed* — a harvest is hauled by
 * the resident nearest the plot (448), a unit crosses an edge in the arms of a dino that remembers
 * carrying it (447/451), a landmark is raised where a dino stood. Repair alone happened *to* a ground
 * rather than *in* it.
 *
 * Now a resident of a ground carrying a ruin walks to it, and the patch-up resolves **on arrival**. The
 * arithmetic in `upkeep.ts` is untouched; what moved is *who* triggers `repaired` and where they are
 * standing when it happens.
 *
 * Pure TypeScript (no Phaser, no WebLLM): the dispatch decision, the budget and the words are decided
 * here and unit-tested. WorldScene owns the errand state and the walk, exactly as it owns the 381 escort
 * this is the one-legged sibling of. The pile is debited **on arrival, never on dispatch**, so an errand
 * that runs out of steps costs the ground nothing and the next pass simply tries again.
 */

import { UPKEEP_GLYPH } from './upkeep';

/** The mark the fixer floats and the ticker carries — 480's own glyph, so the two read as one system. */
export const MEND_GLYPH = UPKEEP_GLYPH;

/**
 * Steps the errand gets. `stepToward` moves one axis per step, so the walk costs *manhattan* distance and
 * a corner-to-corner crossing of the 20×15 map is ~33. Sized to cover the ordinary case with room, not the
 * pathological one; the budget is the safety valve that stops a fixer chasing a ruin it can't reach.
 */
export const MEND_STEPS = 40;

/**
 * Real-time gate between dispatches (the 333 cooldown, the same primitive migration paces on). Wall-clock
 * rather than in-game, so the cadence holds at either clock rate (493) — and short, because CHARTER v7's
 * whole finding was that a beat nobody can wait out is not a beat. One ruin at a time, one every 20s.
 */
export const MEND_COOLDOWN_MS = 20_000;

/** The live errand: who is walking, to which ground's ruin, and how much budget is left. */
export interface Mend {
  fixer: string;
  zone: string;
  tileX: number;
  tileY: number;
  steps: number;
}

/**
 * Can this ground pay for the patch-up? A count in, not a pile, so the module needs no resource import
 * for one comparison. The scene reads `pileTotal` — the *kind* spent is `upkeep.ts`'s call, not ours.
 */
export function canMend(pileUnits: number, cost: number): boolean {
  return cost > 0 && pileUnits >= cost;
}

/** The fixer's bubble as it reaches the ruin — said to nobody in particular, which is the point. */
export function mendLine(fixer: string, structure: string): string {
  return `${fixer}: There. That'll hold. ${structure}`;
}

/** What the fixer keeps — the courier's pride (451) in the register of a day's work. */
export function mendMemory(zoneName: string, structure: string): string {
  return `you put ${zoneName}'s ${structure} back up with your own hands`;
}

/** The ticker line that names *who*. 480's `patchedLine` still fires beside it — the ground did a thing
 *  and a dino did a thing, and they are two different sentences. */
export function mendEventLine(fixer: string, zoneName: string, structure: string): string {
  return `${MEND_GLYPH} ${fixer} walked over and put ${zoneName}'s ${structure} back up`;
}
