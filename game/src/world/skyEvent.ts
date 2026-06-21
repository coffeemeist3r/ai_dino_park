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

/**
 * Chance a sky event begins on each roll. The roll is driven off a *real-time* cadence
 * (SKY_ROLL_INTERVAL_MS) rather than in-game hours, so offline catch-up and per-minute clock
 * advances don't retroactively conjure events; combined with the one-per-in-game-day cap in
 * WorldScene this keeps the spectacle a rare, live surprise.
 */
export const SKY_CHANCE = 0.05;

/** How often (real ms) the live game rolls for a sky event. */
export const SKY_ROLL_INTERVAL_MS = 45_000;

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

/** Outermost ring a dino will settle on to watch (edge of the cluster). */
export const GAZE_MAX_RING = 2;

/**
 * How close a dino presses in to watch a sky event (BACKLOG-150). The collective beat (144) used to pull
 * every dino onto the same gather tile; here each gets a personal ring shaped by temperament, so a bold,
 * curious dino crowds right under the spectacle (ring 0) while a timid, incurious one hangs back at the
 * edge of the cluster (ring 2). Same event, a different read per personality. Used as the per-dino radius
 * for `atGather` in WorldScene's gather loop. Structural trait param — keeps this module free of an ai/ import.
 */
export function gazeRing(traits: { bravery: number; curiosity: number }): 0 | 1 | 2 {
  const boldness = (traits.bravery + traits.curiosity) / 2;
  if (boldness >= 0.6) return 0;
  if (boldness >= 0.35) return 1;
  return GAZE_MAX_RING;
}

/** How much a shared sky-watch warms a companion pair's bond (BACKLOG-288). */
export const SHARED_WONDER_BOND = 4;

export interface Gazer {
  name: string;
  tileX: number;
  tileY: number;
}

/**
 * Stargazing companions (BACKLOG-288): which gazers ended up watching the sky side by side. Two dinos
 * that settled within one tile (Chebyshev ≤ 1) of each other are companions — the bold who pressed in
 * together under the spectacle, the timid who happened to halt beside one another. Returns each unordered
 * pair once. Pure; takes plain positions so this module stays free of an ai/ import.
 */
export function stargazingPairs(gazers: Gazer[]): [string, string][] {
  const pairs: [string, string][] = [];
  for (let i = 0; i < gazers.length; i++) {
    for (let j = i + 1; j < gazers.length; j++) {
      const a = gazers[i];
      const b = gazers[j];
      if (a.name === b.name) continue;
      if (Math.abs(a.tileX - b.tileX) <= 1 && Math.abs(a.tileY - b.tileY) <= 1) pairs.push([a.name, b.name]);
    }
  }
  return pairs;
}
