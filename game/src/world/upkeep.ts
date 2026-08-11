/**
 * A landmark that has to be kept up (BACKLOG-480) — the last unchecked arc of Milestone 12, and the beat
 * that turns the build arc (146 → 286/315/417 → 454) from a ratchet into an economy. Banked food spoils at
 * cap (455), a plot's yield can be worked flat (384/473), a pile drains when it builds — but a *structure*,
 * once raised, has been permanent and free since the gathering spine shipped, which is why a zone's
 * structure count is the only number in this park that cannot fall.
 *
 * Now a standing landmark draws a small upkeep from its ground's resource pile each in-game day, and a
 * ground that can't pay lets one fall into **disrepair** — a reversible state, never a demolition — which
 * the granary's food-cap lift (454) and the prosperity index (428) then read past. The 455 lesson applied
 * to walls: plenty you don't tend stops being free.
 *
 * Pure (no Phaser): what is owed, what is paid, what lapses and what is patched up are all decided here and
 * unit-tested. WorldScene owns *which* structure lapses (the newest standing) and which is patched (the
 * oldest derelict), because only it holds the arrays.
 *
 * Two calibrations make it safe rather than punishing, both deliberate:
 *   - a ground with a single landmark owes **nothing**, so a fresh park is inert (476's precedent), and
 *   - a derelict landmark owes nothing either, so a struggling ground's bill *falls* as it lapses and the
 *     system converges on a skyline the ground can afford instead of cascading it to zero.
 */

import { RESOURCE_GLYPH, type ResourceKind, type Stockpile } from './resource';

/**
 * One placed landmark, as WorldScene has stored cairns / lean-tos / thatches / granaries since 286.
 * `derelict` is BACKLOG-480's addition: additive and optional, so every save written before this cycle
 * restores with a fully maintained skyline.
 */
export interface Landmark {
  tileX: number;
  tileY: number;
  zone: string;
  derelict?: boolean;
}

/** How many standing landmarks share one unit of daily upkeep. At 2: one landmark is free, two or three
 *  cost a unit a day, four or five cost two. The knob — tune here, not at the call site. */
export const STRUCTURES_PER_UPKEEP = 2;

/** What patching one derelict landmark back up costs, paid out of the same pile. */
export const REPAIR_COST = 1;

/** How faded a derelict landmark draws in-world, so disrepair is visible where it happens. */
export const DERELICT_ALPHA = 0.45;

export const UPKEEP_GLYPH = '🛠️';

/** What this ground owes today, given how many landmarks it is actually keeping up. */
export function upkeepDue(standing: number): number {
  return Math.floor(Math.max(0, standing) / STRUCTURES_PER_UPKEEP);
}

export interface UpkeepPlan {
  /** The pile after upkeep. The **same reference** as the input when nothing happened at all. */
  pile: Stockpile;
  /** Units actually drawn from the pile (upkeep + any repair). */
  paid: number;
  /** Standing landmarks that fell into disrepair this pass — one per unpaid unit. */
  lapsed: number;
  /** Derelict landmarks patched back up this pass (at most one a pass). */
  repaired: number;
}

/** The kinds in a fixed order, so "largest kind" ties break deterministically rather than by object order. */
const KINDS = Object.keys(RESOURCE_GLYPH) as ResourceKind[];

/** Spend one unit off whichever kind is largest (ties by KINDS order), or null when the pile is empty.
 *  Draining the deepest kind first keeps upkeep from emptying a scarce kind while a plentiful one sits full. */
function spendOne(pile: Stockpile): Stockpile | null {
  let best: ResourceKind | null = null;
  for (const k of KINDS) if ((pile[k] ?? 0) > 0 && (best === null || (pile[k] ?? 0) > (pile[best] ?? 0))) best = k;
  if (best === null) return null;
  return { ...pile, [best]: (pile[best] ?? 0) - 1 };
}

/**
 * One zone's upkeep pass. Pays what it can toward `upkeepDue(standing)`; every unpaid unit drops one
 * standing landmark into disrepair. If the bill is fully met and a spare `REPAIR_COST` remains, one
 * derelict landmark is patched back up — so the state is reversible by construction, and a ground that
 * recovers its pile rebuilds its skyline without anyone raising anything new.
 *
 * Returns the same `pile` reference when nothing at all happened (the `spoilFood` no-op contract), so the
 * caller can skip both the log and the save.
 */
export function runUpkeep(pile: Stockpile, standing: number, derelict: number): UpkeepPlan {
  const due = upkeepDue(standing);
  let cur = pile;
  let paid = 0;
  for (let i = 0; i < due; i++) {
    const next = spendOne(cur);
    if (next === null) break; // pile is empty — the rest of the bill lapses
    cur = next;
    paid++;
  }
  const lapsed = Math.min(due - paid, Math.max(0, standing));
  let repaired = 0;
  if (lapsed === 0 && derelict > 0) {
    let spare = cur;
    let afford = true;
    for (let i = 0; i < REPAIR_COST; i++) {
      const next = spendOne(spare);
      if (next === null) {
        afford = false;
        break;
      }
      spare = next;
    }
    if (afford) {
      cur = spare;
      paid += REPAIR_COST;
      repaired = 1;
    }
  }
  return { pile: paid > 0 ? cur : pile, paid, lapsed, repaired };
}

/**
 * The day-counted twin of the live pass (the 455 → 462 shape). A park left alone for days comes back to the
 * upkeep it owed, through this same pure function rather than a second rule. `standing`/`derelict` are
 * carried forward across the simulated days, so a ground that lapses on day 1 owes less on day 2 — the
 * convergence the live pass has, applied to an absence. Breaks early once a pass changes nothing.
 */
export function runUpkeepOverDays(pile: Stockpile, days: number, standing: number, derelict: number): UpkeepPlan {
  if (days <= 0) return { pile, paid: 0, lapsed: 0, repaired: 0 };
  let cur = pile;
  let paid = 0;
  let lapsed = 0;
  let repaired = 0;
  let up = Math.max(0, standing);
  let down = Math.max(0, derelict);
  for (let i = 0; i < days; i++) {
    const plan = runUpkeep(cur, up, down);
    if (plan.pile === cur && plan.lapsed === 0 && plan.repaired === 0) break; // settled — further days are no-ops
    cur = plan.pile;
    paid += plan.paid;
    lapsed += plan.lapsed;
    repaired += plan.repaired;
    up = up - plan.lapsed + plan.repaired;
    down = down + plan.lapsed - plan.repaired;
  }
  return { pile: paid > 0 || lapsed > 0 ? cur : pile, paid, lapsed, repaired };
}

/** The ticker line when a landmark falls into disrepair. No leading article — two of the zone names carry
 *  their own ("The Grove"), the same shape as `spoiledLine` (455). */
export function lapsedLine(zoneName: string, glyph: string): string {
  return `${UPKEEP_GLYPH} ${zoneName}'s ${glyph} fell into disrepair`;
}

/** The ticker line when a ground patches one back up. */
export function patchedLine(zoneName: string, glyph: string): string {
  return `${UPKEEP_GLYPH} ${zoneName} patched up its ${glyph}`;
}
