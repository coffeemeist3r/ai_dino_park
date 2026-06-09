/**
 * World-scale night event (BACKLOG-144) — the bowl's first *collective* beat.
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable, same shape as world/comfort.ts.
 * On a rare clear night the sky lights up (a meteor shower or an aurora) and the whole cast
 * drifts to one spot to gather and gawp at it together, sharing a single memory. This module
 * owns the *decisions* — which event, whether one fires, has a dino arrived, has it ended —
 * and WorldScene owns the shimmer overlay + the movement glue.
 */

export type SkyEventId = 'meteors' | 'aurora';

export interface SkyEvent {
  id: SkyEventId;
  label: string;
  /** Shimmer overlay tint (0xRRGGBB) painted above the night tint. */
  color: number;
  /** The floating line each dino throws as it gathers to watch. */
  bubble: string;
  /** The single shared memory every gazer files — the same line for all of them. */
  memory: string;
  /** How many in-game minutes the spectacle lasts. */
  durationMin: number;
}

export const SKY_EVENTS: ReadonlyArray<SkyEvent> = [
  {
    id: 'meteors',
    label: 'Meteor shower',
    color: 0x88aaff,
    bubble: '✨ Falling stars!',
    memory: 'the whole sky rained falling stars, and we all watched it together',
    durationMin: 90,
  },
  {
    id: 'aurora',
    label: 'Aurora',
    color: 0x66ffcc,
    bubble: '✨ The sky is dancing!',
    memory: 'the sky lit up green and the whole bowl gathered to watch the aurora',
    durationMin: 90,
  },
];

/** Open tile near the centre of the bowl the cast gathers on — distinct from the den (10,11). */
export const SKY_GATHER_TILE = { tileX: 10, tileY: 7 };

/** Per-in-game-hour chance a sky event begins on a clear night. Rare enough to feel special. */
export const SKY_CHANCE = 0.18;

function clamp01(n: number): number {
  return Math.max(0, Math.min(0.999999, n));
}

/** Map a 0..1 roll across SKY_EVENTS so every event is reachable. */
export function pickSkyEvent(roll: number): SkyEvent {
  const i = Math.floor(clamp01(roll) * SKY_EVENTS.length);
  return SKY_EVENTS[i];
}

export interface SkyRoll {
  isClearNight: boolean;
  /** An event is already running — never start a second. */
  active: boolean;
  /** The "does it fire?" draw, 0..1. */
  chanceRoll: number;
  /** The "which event?" draw, 0..1. */
  pickRoll: number;
  /** Override the per-hour chance (defaults to SKY_CHANCE). */
  chance?: number;
}

/** Decide whether — and which — sky event begins this hour. Null on day, mid-event, or a missed roll. */
export function rollSkyEvent(opts: SkyRoll): SkyEvent | null {
  if (!opts.isClearNight || opts.active) return null;
  if (opts.chanceRoll >= (opts.chance ?? SKY_CHANCE)) return null;
  return pickSkyEvent(opts.pickRoll);
}

/** Has a dino reached the gather spot? A radius means five dinos needn't stack on the exact tile. */
export function atGather(
  tile: { tileX: number; tileY: number },
  gather: { tileX: number; tileY: number } = SKY_GATHER_TILE,
  radius = 1,
): boolean {
  return Math.abs(tile.tileX - gather.tileX) <= radius && Math.abs(tile.tileY - gather.tileY) <= radius;
}

/** Has the spectacle run its course? */
export function skyExpired(elapsedMin: number, event: SkyEvent): boolean {
  return elapsedMin >= event.durationMin;
}
