/**
 * NPC wandering — pure tile math, no Phaser. Node-testable.
 *
 * A dino picks a direction (including "stay") and steps one tile, clamped
 * to the map. WorldScene drives this off the world clock.
 */

export interface Tile {
  tileX: number;
  tileY: number;
}

export const WANDER_DIRS = [
  [0, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function wanderStep(t: Tile, dirIndex: number, cols: number, rows: number): Tile {
  const i = ((dirIndex % WANDER_DIRS.length) + WANDER_DIRS.length) % WANDER_DIRS.length;
  const [dx, dy] = WANDER_DIRS[i];
  return {
    tileX: clamp(t.tileX + dx, 0, cols - 1),
    tileY: clamp(t.tileY + dy, 0, rows - 1),
  };
}
