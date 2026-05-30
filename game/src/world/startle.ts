/**
 * Tap the glass (BACKLOG-057) — the keeper raps the vivarium wall and the dinos
 * react by temperament: the timid bolt away, the bold creep closer to investigate,
 * the far-off don't notice. Pure (no Phaser): the reaction + the step are decided
 * here and unit-tested; WorldScene turns a pointer click into a call.
 */

import type { Tile } from './movement';
import { stepToward } from './movement';

export type StartleReaction = 'bolt' | 'investigate' | 'ignore';

export const STARTLE_RANGE = 6; // tiles — beyond this a tap goes unnoticed
const BOLD = 0.55; // bravery at/above which a dino investigates rather than bolts

/** Decide how a dino reacts to a tap `distTiles` away, given its bravery (0..1). */
export function reactionFor(bravery: number, distTiles: number): StartleReaction {
  if (distTiles > STARTLE_RANGE) return 'ignore';
  return bravery >= BOLD ? 'investigate' : 'bolt';
}

/** One tile directly away from the tap, along the dominant axis, clamped to the map. */
export function fleeStep(from: Tile, tap: Tile, cols: number, rows: number): Tile {
  const dx = from.tileX - tap.tileX;
  const dy = from.tileY - tap.tileY;
  let { tileX, tileY } = from;
  if (Math.abs(dx) >= Math.abs(dy)) tileX += dx === 0 ? 1 : Math.sign(dx);
  else tileY += dy === 0 ? 1 : Math.sign(dy);
  return {
    tileX: Math.max(0, Math.min(cols - 1, tileX)),
    tileY: Math.max(0, Math.min(rows - 1, tileY)),
  };
}

/** The next tile for a dino given its reaction: flee, approach, or stay put. */
export function startleStep(from: Tile, tap: Tile, reaction: StartleReaction, cols: number, rows: number): Tile {
  if (reaction === 'investigate') return stepToward(from, tap, cols, rows);
  if (reaction === 'bolt') return fleeStep(from, tap, cols, rows);
  return from;
}
