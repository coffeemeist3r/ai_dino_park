/**
 * Resource regrowth (BACKLOG-384) — the first renewable constraint on the gather economy. Until now every
 * zone rolled a resource at a flat chance forever (146/314): infinite yield, no matter how hard a zone was
 * worked. Now each zone carries a *yield* (fertility, 0..1) that a pickup thins and time slowly restores, so
 * over-gathering a zone stalls its spawns until it recovers — a live pressure that finally gives carry/barter
 * between a worked-out and a fresh zone (329/356/358) an economic reason, not only a diverging-mix flavor one.
 *
 * Pure (no Phaser): deplete/regrow/scale/roll are decided + unit-tested here; WorldScene holds the per-zone
 * yield, depletes it on a pickup (checkGather) and regrows + scales the spawn roll each tick (maybeSpawnResource).
 * Transient by design — a reload starts each zone fresh-full; regrowth is a within-session pressure, not saved
 * (so 384 needs no SAVE_VERSION bump).
 */

export const YIELD_MAX = 1;
export const YIELD_DEPLETE = 0.34; // a pickup thins the zone's yield (~3 back-to-back gathers empty it)
export const YIELD_REGROW = 0.02; // restored per spawn-roll tick (slow — a worked-out zone stays thin a while)

const clamp01 = (y: number) => Math.max(0, Math.min(YIELD_MAX, y));

/** Thin a zone's yield after a pickup, floored at 0 (never negative). Pure. */
export function depleteYield(y: number): number {
  return clamp01(y - YIELD_DEPLETE);
}

/** Restore a zone's yield one tick toward full, capped at YIELD_MAX (never above full). Pure. */
export function regrowYield(y: number): number {
  return clamp01(y + YIELD_REGROW);
}

/**
 * The spawn chance scaled by a zone's yield — a full zone spawns at the base rate (pre-384 back-compat), a
 * thinned zone proportionally rarer, an exhausted zone (yield 0) never. `y` is clamped to [0,1] defensively.
 */
export function yieldSpawnChance(base: number, y: number): number {
  return base * clamp01(y);
}

/** Whether a resource spawns this roll in a zone of the given yield (base scaled by yield). */
export function rollResourceAt(base: number, y: number, rand: () => number = Math.random): boolean {
  return rand() < yieldSpawnChance(base, y);
}
