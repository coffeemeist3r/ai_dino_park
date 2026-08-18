/**
 * The world's dice (BACKLOG-486, rework).
 *
 * The e2e suite lost one spec per full run for four cycles, a different victim each time, and the reading
 * that the cause was *load* survived exactly as long as it took to measure it: capping the workers and
 * lifting the per-test budget above the boot ceiling still left runs failing, and the failures were not
 * timeouts. `cycle-129-berth` fell by **exactly one tile** — a wander step that happened to go toward the
 * food. That is not contention. That is a spec asserting over a coin the game flips.
 *
 * So the dice get a seam. Unseeded, `rand()` *is* `Math.random()` — production is byte-for-byte unchanged
 * and every existing test that stubs `Math.random` still works, because the delegation is live. Seeded (only
 * ever from the e2e boot helper), it is a plain LCG: the same spec sees the same draws every run, so a spec
 * that passes once passes always and a spec that fails does so because the game is wrong.
 *
 * The point is not that randomness is bad. It is that a suite whose green depends on a die roll cannot tell
 * you anything, and four cycles of chasing individual victims was the cost of not having this.
 */

let state: number | null = null;

/** Seed the world's dice (e2e only), or pass `null` to hand them back to `Math.random`. */
export function seedRandom(seed: number | null): void {
  state = seed === null ? null : seed >>> 0;
}

/** Is the world running on seeded dice? (The dev hook reports this so a spec can prove its own footing.) */
export function isSeeded(): boolean {
  return state !== null;
}

/** A draw in [0, 1). Numerical Recipes' LCG constants when seeded; `Math.random` when not. */
export function rand(): number {
  if (state === null) return Math.random();
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return state / 4294967296;
}
