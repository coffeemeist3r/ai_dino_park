/**
 * Seasons (BACKLOG-159) — a turning year layered on the realtime clock. The season is *derived*
 * from the persisted day (nothing new in the save): a week per season, a 28-day year, wrapping
 * forever. The tint is a subtle wash under the day/night overlay — the year colours the bowl,
 * the sun still owns the light.
 *
 * Pure TypeScript (no Phaser): Node-testable. WorldScene paints the wash and lands the turn beat.
 */

import type { Tint } from './dayNight';

export const SEASONS = ['spring', 'summer', 'fall', 'winter'] as const;
export type Season = (typeof SEASONS)[number];

export const SEASON_LENGTH_DAYS = 7;

/** The season for a 1-indexed clock day. Day 1–7 spring, 8–14 summer, …, 29 spring again. */
export function seasonFor(day: number): Season {
  const idx = Math.floor((day - 1) / SEASON_LENGTH_DAYS) % SEASONS.length;
  return SEASONS[(idx + SEASONS.length) % SEASONS.length];
}

/** The new season iff the clock moved forward across a boundary; null otherwise. */
export function seasonTurned(prevDay: number, day: number): Season | null {
  if (day <= prevDay) return null;
  const next = seasonFor(day);
  return next === seasonFor(prevDay) ? null : next;
}

/** Subtle per-season wash. Alphas capped at 0.12 so the day/night overlay stays dominant. */
export const SEASON_TINT: Record<Season, Tint> = {
  spring: { color: 0x58c04a, alpha: 0.08 },
  summer: { color: 0xe8c050, alpha: 0.09 },
  fall: { color: 0xd07030, alpha: 0.11 },
  winter: { color: 0x90b8e0, alpha: 0.12 },
};

const TURN_LINES: Record<Season, string> = {
  spring: 'The season turns — spring greens the bowl.',
  summer: 'The season turns — summer gold settles over the grass.',
  fall: 'The season turns — fall browns the edges of everything.',
  winter: 'The season turns — winter pales the light in the bowl.',
};

/** The one-off banner line for a turn. */
export function turnLine(season: Season): string {
  return TURN_LINES[season];
}

/** The memory every dino files when the year turns. */
export function turnMemory(season: Season): string {
  return `the season turned to ${season}`;
}
