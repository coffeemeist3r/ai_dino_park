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

/**
 * The closest of a set of named candidates (BACKLOG-448/452) — the dino nearest the plot that hauls the
 * harvest away, the resident nearest a returning migrant that welcomes it home. Ties break by name so the
 * pick is deterministic (two dinos the same distance away always resolve the same). null when nobody's there.
 */
export function pickNearest(entries: ReadonlyArray<{ name: string; dist: number }>): string | null {
  return (
    [...entries].sort((a, b) => a.dist - b.dist || a.name.localeCompare(b.name))[0]?.name ?? null
  );
}

/** One tile toward `target`, stepping along the axis with the larger remaining distance. Clamped. */
export function stepToward(from: Tile, target: Tile, cols: number, rows: number): Tile {
  const ax = target.tileX - from.tileX;
  const ay = target.tileY - from.tileY;
  if (ax === 0 && ay === 0) return { ...from };
  let nx = from.tileX;
  let ny = from.tileY;
  if (Math.abs(ax) >= Math.abs(ay)) nx += Math.sign(ax);
  else ny += Math.sign(ay);
  return { tileX: clamp(nx, 0, cols - 1), tileY: clamp(ny, 0, rows - 1) };
}
