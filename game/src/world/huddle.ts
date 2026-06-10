/**
 * Season-conditional huddle rules (BACKLOG-171) — the year reaches the den. Cold seasons lower
 * the bond bar and stretch the huddle window (winter packs the den from dusk past dawn); high
 * summer shortens the night so the bowl stays scattered until late.
 *
 * Pure TypeScript (no Phaser): Node-testable. `season` is optional everywhere — omitting it is
 * byte-identical to the cycle-18 behaviour (threshold 8, window = the night day-phase), the same
 * compatibility discipline as `favoriteFood` (cycle 41).
 */

import { dayPhase } from './dayNight';
import type { Season } from './seasons';

/** The legacy cycle-18 bond bar to seek the den (moved here from WorldScene). */
export const HUDDLE_THRESHOLD = 8;

export interface HuddleRule {
  threshold: number;
  /** Window start hour (inclusive) — wraps midnight. */
  start: number;
  /** Window end hour (exclusive). */
  end: number;
}

/**
 * Spring is exactly the legacy night window, so a fresh clock (day 1 = spring) behaves
 * byte-identically to every build since cycle 18.
 */
export const SEASON_HUDDLE: Record<Season, HuddleRule> = {
  spring: { threshold: HUDDLE_THRESHOLD, start: 21, end: 5 },
  summer: { threshold: HUDDLE_THRESHOLD, start: 23, end: 4 },
  fall: { threshold: 6, start: 21, end: 5 },
  winter: { threshold: 4, start: 19, end: 7 },
};

/** The bond bar to seek the den. Season omitted → the legacy threshold. */
export function huddleThreshold(season?: Season): number {
  return season ? SEASON_HUDDLE[season].threshold : HUDDLE_THRESHOLD;
}

/** Is `hour` inside the huddle window? Season omitted → the legacy night day-phase. */
export function inHuddleWindow(hour: number, season?: Season): boolean {
  if (!season) return dayPhase(hour) === 'night';
  const { start, end } = SEASON_HUDDLE[season];
  return start <= end ? hour >= start && hour < end : hour >= start || hour < end;
}
