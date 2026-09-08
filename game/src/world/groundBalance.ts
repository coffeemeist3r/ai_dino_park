/**
 * Ground balance (BACKLOG-536) — what a ground takes in, against what it owes.
 *
 * `upkeep.ts`'s header has promised since cycle 480 that a struggling ground "converges on a skyline the
 * ground can afford instead of cascading it to zero", and since BACKLOG-528 put a second landmark on the
 * Grove that promise is load-bearing on a save nobody has played. The convergence argument rests entirely
 * on the ground *refilling* its bank, and nothing in this park had ever measured the refill rate against
 * the drain rate. So "converges" was a claim in a comment. This module makes it a number.
 *
 * ## What `inflow` is, and the one thing it is not
 *
 * It is a **ceiling, not a forecast.** The real rate a ground banks resources at is additionally gated by
 * `RESOURCE_SPAWN_CHANCE` on every roll, by whether anybody on that ground is awake (`wakingIn`, 524), by
 * whether a dino actually walks over to the thing before something else happens, and by `STOCKPILE_CAP` at
 * the top end. None of those belong in a pure module and none of them can raise the number below.
 *
 * That makes the claim this supports strictly one-directional, and the direction matters:
 *
 * - a skyline whose bill exceeds the ceiling is **structurally insolvent** — no run of luck saves it, and
 *   the ground will shed landmarks into disrepair until the bill fits;
 * - a skyline under the ceiling is **not thereby solvent in practice** — it only means the arithmetic does
 *   not forbid it.
 *
 * Read the number as the second kind of statement and you will over-trust it. It is written here so the
 * next reader does not have to work that out from the code.
 *
 * ## Where the ceiling comes from
 *
 * The pump, not the dice. `maybeSpawnResource` runs once per `WANDER_STEP_MS`, and an in-game day at
 * `ACTIVE_SCALE` is `MINUTES_PER_DAY / ACTIVE_SCALE` real minutes — so `dailyRolls()` is how many chances a
 * ground gets per in-game day. But a ground cannot cash all of them: `YIELD_DEPLETE` comes off the ground's
 * yield with every pickup and only `YIELD_REGROW` goes back on per tick, so it can sustain one gather per
 * `YIELD_DEPLETE / YIELD_REGROW` ticks *however often the roll comes up*. The regrowth rate is the binding
 * constraint and the spawn chance is not, which is itself a finding — a cycle that tunes
 * `RESOURCE_SPAWN_CHANCE` looking for more resources is tuning the wrong knob.
 *
 * Every constant here is imported from the module that owns it. Nothing restates a value; that is
 * `reachability.ts`'s rule 1 and it applies to any module a register entry routes through.
 *
 * Pure TypeScript, no Phaser.
 */

import { ACTIVE_SCALE, MINUTES_PER_DAY, WANDER_STEP_MS } from './clock';
import { YIELD_DEPLETE, YIELD_REGROW } from './regrowth';
import { upkeepDue } from './upkeep';

/** One ground's daily arithmetic. `inflow` is a ceiling (see the header); `outflow` is the actual bill. */
export interface Balance {
  /** Most units per in-game day this ground's yield can sustain. */
  inflow: number;
  /** Units per in-game day the skyline owes — `upkeepDue`, called. */
  outflow: number;
  /** `inflow - outflow`. Negative is structural insolvency. */
  surplus: number;
}

/** Sim pumps per in-game day: the day's real length over the pump period. */
export function dailyRolls(): number {
  const realMinutesPerDay = MINUTES_PER_DAY / ACTIVE_SCALE;
  return (realMinutesPerDay * 60_000) / WANDER_STEP_MS;
}

/** Pumps a ground must rest for to pay back one pickup's worth of yield. */
export function ticksPerGather(): number {
  return YIELD_DEPLETE / YIELD_REGROW;
}

/** Most units a ground can gather in an in-game day, yield-limited. */
export function inflowCeiling(): number {
  return dailyRolls() / ticksPerGather();
}

/** This ground's day, given how many landmarks it is keeping up. */
export function groundBalance(standing: number): Balance {
  const inflow = inflowCeiling();
  const outflow = upkeepDue(standing);
  return { inflow, outflow, surplus: inflow - outflow };
}

/** Can this skyline be paid for at all? False is a defect in the founding state, not in the ground. */
export function solvent(standing: number): boolean {
  return groundBalance(standing).surplus >= 0;
}

/**
 * The largest skyline this park's gather ceiling can pay for.
 *
 * Exported because it is the number a tuning pass actually wants: change `STRUCTURES_PER_UPKEEP` or either
 * yield constant and this moves, and it is the honest way to ask "how much headroom is there?" without
 * re-deriving the inequality at the call site.
 */
export function affordableSkyline(): number {
  let n = 0;
  while (solvent(n + 1)) n++;
  return n;
}
