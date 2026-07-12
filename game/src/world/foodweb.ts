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

/** Has the stalker closed the gap — same tile or one away (Chebyshev ≤ 1)? The empty-hunt trigger. */
export function huntCaught(hunter: Tile, prey: Tile): boolean {
  return chebyshev(hunter, prey) <= 1;
}
