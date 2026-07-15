/**
 * The food web wakes (BACKLOG-367) — the bowl's first hunt.
 *
 * A hungry carnivore (diet.ts / 435) stalks the nearest herbivore, which flees. **Deathless** by design:
 * nothing here removes a dino. When the stalker closes the gap (`huntCaught`) the quarry escapes and the
 * hunt comes up empty — mortality stays a CHARTER call routed to the operator (the cycle-80 hunting split).
 *
 * Pure tile math (no Phaser): Node-testable. WorldScene decides *who* is a hungry carnivore and *who* is in
 * view, drives the stalk/flee steps, and owns the empty-hunt beat, cooldown, and memories.
 */

import type { Tile } from './movement';
import type { Diet } from './diet';

/** Tiles within which a hungry carnivore notices prey. */
export const STALK_RANGE = 6;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function chebyshev(a: Tile, b: Tile): number {
  return Math.max(Math.abs(a.tileX - b.tileX), Math.abs(a.tileY - b.tileY));
}

/**
 * The nearest herbivore within `range` of a hunting carnivore, or null when none is close enough.
 * Deterministic: least Chebyshev distance wins, ties broken by the supplied order (a stable scan).
 */
export function nearestPrey(
  hunter: Tile,
  prey: ReadonlyArray<{ name: string; tile: Tile }>,
  range = STALK_RANGE,
): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const p of prey) {
    const d = chebyshev(hunter, p.tile);
    if (d > range) continue;
    if (d < bestDist) {
      bestDist = d;
      best = p.name;
    }
  }
  return best;
}

/**
 * One tile *away* from the hunter, mirror of `stepToward`: it flees along the axis of greatest separation,
 * widening the gap. When that axis is pinned against a wall (the step wouldn't move), it slides along the
 * other axis instead so a cornered prey still bolts rather than freezing. Always clamped in-bounds.
 */
export function fleeStep(from: Tile, hunter: Tile, cols: number, rows: number): Tile {
  const ax = from.tileX - hunter.tileX;
  const ay = from.tileY - hunter.tileY;
  // Prefer fleeing along the axis where the hunter is closest in the *other* axis — i.e. widen the bigger
  // gap. Ties and zeroes fall through to the slide.
  const preferX = Math.abs(ax) >= Math.abs(ay);
  const sx = Math.sign(ax) || 1;
  const sy = Math.sign(ay) || 1;
  const tryX = (): Tile | null => {
    const nx = clamp(from.tileX + sx, 0, cols - 1);
    return nx !== from.tileX ? { tileX: nx, tileY: from.tileY } : null;
  };
  const tryY = (): Tile | null => {
    const ny = clamp(from.tileY + sy, 0, rows - 1);
    return ny !== from.tileY ? { tileX: from.tileX, tileY: ny } : null;
  };
  const primary = preferX ? tryX() : tryY();
  const slide = preferX ? tryY() : tryX();
  return primary ?? slide ?? { ...from };
}

/** Has the stalker closed the gap — same tile or one away (Chebyshev ≤ 1)? The catch trigger. */
export function huntCaught(hunter: Tile, prey: Tile): boolean {
  return chebyshev(hunter, prey) <= 1;
}

/**
 * The hunt feeds (BACKLOG-437) — how often a closed-gap stalk actually lands a meal. Deliberately low so the
 * bowl doesn't turn into a slaughterhouse: most catches still come up empty (the chase is the point), and the
 * ones that land feed the hunter without ever removing the prey (deathless — the quarry always slips away).
 */
export const HUNT_SUCCESS_CHANCE = 0.3;

/** Did this stalk land? Pure so the rate is unit-pinned and callers can force the outcome (roll 0 / 0.99). */
export function huntSucceeds(roll: number, chance = HUNT_SUCCESS_CHANCE): boolean {
  return roll < chance;
}

/**
 * Rattled after the chase (BACKLOG-440) — the name of the carnivore that most recently chased this dino, read
 * back out of the prey memory 367 files (`you slipped <hunter>'s hunt`), or null when none is fresh. Scans
 * newest-first; `recall` caps the store at 6, so a fright ages out of the window on its own.
 */
export function recentHunter(memories: readonly string[]): string | null {
  for (let i = memories.length - 1; i >= 0; i--) {
    const m = /slipped (.+?)'s hunt/.exec(memories[i]);
    if (m) return m[1];
  }
  return null;
}

/**
 * The hunter's reputation (BACKLOG-442) — fear turns personal. A prey files a `you slipped <hunter>'s hunt`
 * memory each chase (367); `chaseCount` reads how many of those name a *given* hunter, out of whatever slice
 * of the 6-slot recall window it's handed. Same pattern `recentHunter` matches, filtered to one hunter.
 */
export function chaseCount(memories: readonly string[], hunter: string): number {
  let n = 0;
  for (const m of memories) {
    const x = /slipped (.+?)'s hunt/.exec(m);
    if (x && x[1] === hunter) n++;
  }
  return n;
}

/** Repeat chases by the *same* hunter before a prey grows personally wary of it (BACKLOG-442). Two — not
 *  three — because `recall` caps at 6 slots shared with all memory, so three same-hunter hunt lines rarely
 *  coexist; two is a reachable "again — *that* one" while staying distinct from 440's single-chase rattle. */
export const WARY_CHASES = 2;

/** Tiles within which a wary prey startles from its feared hunter (BACKLOG-442) — reuses the stalk range; a
 *  named knob so "keeps its distance" can be widened later without hunting the magic number. */
export const WARY_RANGE = STALK_RANGE;

/** Is this dino personally wary of `hunter` — chased by it at least `threshold` times (BACKLOG-442)? */
export function fearsHunter(memories: readonly string[], hunter: string, threshold = WARY_CHASES): boolean {
  return chaseCount(memories, hunter) >= threshold;
}

/**
 * Predator/prey in the book (BACKLOG-443) — the food web made legible. `catchTally` counts a carnivore's
 * landed hunts (the `you brought down a meal` memory 437 files); `escapeTally` counts a prey's escapes (the
 * `you slipped <hunter>'s hunt` memory 367 files, across *all* hunters). Both read the live recall window
 * (capped at 6 shared slots), so a standing is *recent* food-web activity, exactly as 442's wariness is.
 */
export function catchTally(memories: readonly string[]): number {
  return memories.filter((m) => m === 'you brought down a meal').length;
}

export function escapeTally(memories: readonly string[]): number {
  return memories.filter((m) => /slipped (.+?)'s hunt/.test(m)).length;
}

/**
 * A dino's food-web standing line for the collection book (BACKLOG-443): a carnivore reads its catches, a
 * herbivore its escapes. **null** when that tally is 0, so a dino with no food-web history shows no line
 * (the book stays clean, mirroring how `knows N rumors` hides at 0). Reuses the existing hunt glyphs
 * (🦖 hunt / 💨 fleeing) so no new art is needed.
 */
export function foodwebStanding(diet: Diet, memories: readonly string[]): string | null {
  if (diet === 'carnivore') {
    const n = catchTally(memories);
    return n > 0 ? `🦖 brought down ${n} meal${n === 1 ? '' : 's'}` : null;
  }
  const n = escapeTally(memories);
  return n > 0 ? `💨 slipped ${n} hunt${n === 1 ? '' : 's'}` : null;
}
