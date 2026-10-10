/**
 * Festivals (BACKLOG-026, Milestone 28 tentpole). Pure TypeScript (no Phaser): Node-testable.
 *
 * Once a season, on its first day at mid-morning, the whole park walks to the bowl pond. Residents of the other
 * grounds come as guests and go home when it closes (596). Who opens it and who keeps to the edge is read off the
 * bond and grudge graphs (594). WorldScene owns the walk; this module owns the decisions and the words.
 */

import type { GameTime } from './clock';
import { SEASON_LENGTH_DAYS, type Season } from './seasons';
import { bondPoints, type Bonds } from '../social/bonds';
import { worstRival } from '../social/grudges';
import type { Personality } from '../ai/personality';

export const FESTIVAL_HOUR = 10;
export const FESTIVAL_HOURS = 2;
export const FESTIVAL_DURATION_MIN = FESTIVAL_HOURS * 60;

/** Beside the bowl's NW pond (water x∈[2,4], y∈[2,3]), on open grass. */
export const FESTIVAL_TILE = { tileX: 6, tileY: 4 };

export const LEADER_RING = 0;
export const CIRCLE_RING = 1;
export const SULK_RING = 3;

/** How often (real ms) the live game checks the calendar. */
export const FESTIVAL_CHECK_MS = 3_000;

/** The absolute season index for a 1-indexed day: day 1–7 → 0, 8–14 → 1, … never wraps. */
export function seasonIndex(day: number): number {
  return Math.floor((day - 1) / SEASON_LENGTH_DAYS);
}

/** The season index whose festival is due now, or null. Due on a season's first day, inside the window, once. */
export function festivalDue(t: GameTime, lastSeason: number): number | null {
  if ((t.day - 1) % SEASON_LENGTH_DAYS !== 0) return null;
  if (t.hour < FESTIVAL_HOUR || t.hour >= FESTIVAL_HOUR + FESTIVAL_HOURS) return null;
  const idx = seasonIndex(t.day);
  return idx > lastSeason ? idx : null;
}

/** Each attendee with a rival in the circle, mapped to that foe. */
export function festivalSulkers(attendees: readonly string[], grudges: Bonds): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of attendees) {
    const foe = worstRival(name, grudges, attendees.filter((n) => n !== name));
    if (foe) out[name] = foe;
  }
  return out;
}

/** The non-sulking attendee with the most bond to the rest of the circle; null when nobody is bonded to anyone. */
export function festivalLeader(attendees: readonly string[], bonds: Bonds, sulkers: Record<string, string>): string | null {
  let best: string | null = null;
  let bestSum = 0;
  for (const name of attendees) {
    if (sulkers[name]) continue;
    const sum = attendees.reduce((acc, o) => (o === name ? acc : acc + bondPoints(bonds, name, o)), 0);
    if (sum > bestSum) {
      best = name;
      bestSum = sum;
    }
  }
  return best;
}

export function festivalRing(name: string, leader: string | null, sulkers: Record<string, string>): number {
  if (name === leader) return LEADER_RING;
  if (sulkers[name]) return SULK_RING;
  return CIRCLE_RING;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** The leader's opening line, in its own register (the 139 split). */
export function openingLine(season: Season, traits?: Personality): string {
  if (traits && traits.agreeableness < 0.35) return `Fine. Everyone's here. It's ${season}. Let's get on with it.`;
  if (traits && traits.sociability < 0.35) return `...${cap(season)}, then. Good that you all came.`;
  return `Everyone's here! ${cap(season)}'s come round again — come stand by the water!`;
}

export function sulkLine(foe: string): string {
  return `😤 not standing anywhere near ${foe}`;
}

export function festivalBanner(season: Season): string {
  return `🎏 The ${season} festival — the whole park gathers at the bowl pond`;
}

export function festivalClosedLine(season: Season): string {
  return `🎏 The ${season} festival is over — the guests head home`;
}

/** The memory an attendee files at the opening. */
export function festivalMemory(
  name: string,
  season: Season,
  leader: string | null,
  sulkers: Record<string, string>,
): string {
  if (name === leader) return `opened the ${season} festival at the bowl pond`;
  const foe = sulkers[name];
  if (foe) return `the ${season} festival — kept to the edge; ${foe} was there`;
  return leader ? `the ${season} festival at the bowl pond — ${leader} opened it` : `the ${season} festival at the bowl pond`;
}

/** A guest: where it lives and the tile it left from, so the walk home lands it where it was. */
export interface Guest {
  home: string;
  tileX: number;
  tileY: number;
}

/** The zone map a save should write while guests stand in the bowl: every guest back on its home ground. */
export function zonesWithGuestsHome(zones: Record<string, string>, guests: Record<string, Guest>): Record<string, string> {
  const out = { ...zones };
  for (const [name, g] of Object.entries(guests)) out[name] = g.home;
  return out;
}
