/**
 * Festivals (BACKLOG-026, Milestone 28 tentpole). Pure TypeScript (no Phaser): Node-testable.
 *
 * Once a season, on its first day at mid-morning, the whole park walks to the bowl pond. Residents of the other
 * grounds come as guests and go home when it closes (596). Who opens it and who keeps to the edge is read off the
 * bond and grudge graphs (594). WorldScene owns the walk; this module owns the decisions and the words.
 */

import type { GameTime } from './clock';
import { SEASON_LENGTH_DAYS, type Season } from './seasons';
import { bondPoints, strengthen, type Bonds } from '../social/bonds';
import { worstRival } from '../social/grudges';
import type { Personality } from '../ai/personality';
import { LONER_FLOOR } from './loner';
import type { Tile } from './movement';
import { barterSwap, RESOURCE_GLYPH, structureRecipe, type BarterSwap, type ResourceKind, type Stockpile } from './resource';
import { BOWL_ID } from './zones';

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

/** Each season's rite (BACKLOG-597): what the festival is, its glyph, the mark at the pond, the circle's bubble. */
export interface Rite {
  name: string;
  glyph: string;
  artKey: string;
  bubble: string;
}

export const FESTIVAL_RITES: Record<Season, Rite> = {
  spring: { name: 'blossom ring', glyph: '🌸', artKey: 'festival-spring', bubble: '🌸 round the ring!' },
  summer: { name: 'sun dance', glyph: '☀️', artKey: 'festival-summer', bubble: '☀️ dance for the sun!' },
  fall: { name: 'harvest heap', glyph: '🍂', artKey: 'festival-fall', bubble: '🍂 one more on the heap!' },
  winter: { name: 'lantern vigil', glyph: '🏮', artKey: 'festival-winter', bubble: '🏮 hush… watch the light' },
};

export const FESTIVAL_ART_KEYS = Object.values(FESTIVAL_RITES).map((r) => r.artKey);

/** The pond's east bank, beside the festival tile: where the rite's mark stands while the festival is open. */
export const RITE_TILE = { tileX: 5, tileY: 3 };

export function festivalRite(season: Season): Rite {
  return FESTIVAL_RITES[season];
}

export function festivalBanner(season: Season): string {
  const r = festivalRite(season);
  return `${r.glyph} The ${season} festival — a ${r.name} at the bowl pond`;
}

export function festivalClosedLine(season: Season): string {
  return `${festivalRite(season).glyph} The ${season} festival is over — the guests head home`;
}

/** The memory an attendee files at the opening. */
export function festivalMemory(
  name: string,
  season: Season,
  leader: string | null,
  sulkers: Record<string, string>,
): string {
  const rite = festivalRite(season).name;
  if (name === leader) return `opened the ${season} festival — led the ${rite}`;
  const foe = sulkers[name];
  if (foe) return `the ${season} festival — kept to the edge; ${foe} was there`;
  return leader ? `the ${season} festival — the ${rite}; ${leader} opened it` : `the ${season} festival — the ${rite}`;
}

/** What a dino carries out of a festival until it tells the keeper (BACKLOG-595). Transient, spoken once. */
export interface FestivalTale {
  season: Season;
  leader: string | null;
  foe?: string;
  /** BACKLOG-180: who it stood beside in the ring and walked away friends with. */
  friend?: string;
}

/** The opener a dino leads its next greet with after a festival, in its register (the 139 split). */
export function festivalOpener(name: string, tale: FestivalTale, traits?: Personality): string {
  const head = festivalHead(name, tale, traits);
  return tale.friend ? `${head} ${ringFriendLine(tale.friend, traits)}` : head;
}

function festivalHead(name: string, tale: FestivalTale, traits?: Personality): string {
  const { season, leader, foe } = tale;
  const rite = festivalRite(season).name;
  const prickly = !!traits && traits.agreeableness < 0.35;
  if (name === leader) {
    return prickly
      ? `Somebody had to open the ${season} festival. It went fine.`
      : `I opened the ${season} festival. Everyone came to the ${rite}.`;
  }
  if (foe) return `The ${season} festival. ${foe} was there, so I kept to the edge.`;
  if (prickly) return leader ? `The ${season} festival. ${leader} opened it. It was fine, I suppose.` : `The ${season} festival. It was fine, I suppose.`;
  if (traits && traits.sociability < 0.35) return `The ${season} festival's over. Good. That was a lot of dinos.`;
  return leader ? `The ${season} festival was lovely — ${leader} opened the ${rite}.` : `The ${season} festival was lovely.`;
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

/** The bump two circle members get for standing side by side through a festival (BACKLOG-180). Flat: a one-off beat. */
export const RING_BOND = 10;

/** Every pair of the given dinos standing within one tile of each other (Chebyshev), each once, a < b, sorted. */
export function ringPairs(positions: Record<string, Tile>): [string, string][] {
  const names = Object.keys(positions).sort();
  const out: [string, string][] = [];
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const a = positions[names[i]];
      const b = positions[names[j]];
      if (Math.max(Math.abs(a.tileX - b.tileX), Math.abs(a.tileY - b.tileY)) <= 1) out.push([names[i], names[j]]);
    }
  }
  return out;
}

/**
 * Who spends the festival beside whom: each circle member keeps company with at most one neighbour. Strangers pair
 * first (lowest bond, then name), so the ring is where unlikely pairs meet; a crowd of ten makes a handful of pairs,
 * not forty-five.
 */
export function ringPartners(bonds: Bonds, pairs: readonly [string, string][]): [string, string][] {
  const taken = new Set<string>();
  const out: [string, string][] = [];
  const ordered = [...pairs].sort((x, y) => bondPoints(bonds, x[0], x[1]) - bondPoints(bonds, y[0], y[1]) || x.join('|').localeCompare(y.join('|')));
  for (const [a, b] of ordered) {
    if (taken.has(a) || taken.has(b)) continue;
    taken.add(a);
    taken.add(b);
    out.push([a, b]);
  }
  return out;
}

/** Each pair gains `RING_BOND`; `crossed` is the pairs that went from under the friend floor to at or over it. */
export function ringFriends(bonds: Bonds, pairs: readonly [string, string][], floor = LONER_FLOOR): { bonds: Bonds; crossed: [string, string][] } {
  let next = bonds;
  const crossed: [string, string][] = [];
  for (const [a, b] of pairs) {
    const before = bondPoints(next, a, b);
    next = strengthen(next, a, b, RING_BOND);
    if (before < floor && bondPoints(next, a, b) >= floor) crossed.push([a, b]);
  }
  return { bonds: next, crossed };
}

/** The sentence a dino adds to its festival tale for a friend made in the ring, in its register. */
export function ringFriendLine(friend: string, traits?: Personality): string {
  if (traits && traits.agreeableness < 0.35) return `Stood next to ${friend} the whole time. ${friend} is alright.`;
  if (traits && traits.sociability < 0.35) return `${friend} stood by me. I didn't mind.`;
  return `I stood next to ${friend} in the ring — we're friends now.`;
}

export function ringFriendMemory(season: Season, friend: string): string {
  return `the ${season} festival — stood beside ${friend}; friends now`;
}

export function ringFriendTicker(a: string, b: string): string {
  return `🌱 ${a} and ${b} stood together in the ring — friends now`;
}

/** The fair (BACKLOG-599): a guest's basket stands here, beside the rite, while the festival is open. */
export const FAIR_TILE = { tileX: 7, tileY: 3 };
export const FAIR_ART_KEY = 'festival-fair';
export const FAIR_GLYPH = '🧺';

/** What a guest trades at the pond: its home gives the bowl what the bowl is short of, and takes home what it is. */
export function fairTrade(home: string, homePile: Stockpile, bowlPile: Stockpile): BarterSwap {
  return barterSwap(homePile, bowlPile, structureRecipe(home), structureRecipe(BOWL_ID));
}

export function fairLine(name: string, ground: string, gave: ResourceKind | null, took: ResourceKind | null): string | null {
  if (gave && took) return `${FAIR_GLYPH} ${name} brought ${RESOURCE_GLYPH[gave]} from ${ground} and took ${RESOURCE_GLYPH[took]} home`;
  if (gave) return `${FAIR_GLYPH} ${name} brought ${RESOURCE_GLYPH[gave]} from ${ground}`;
  if (took) return `${FAIR_GLYPH} ${name} took ${RESOURCE_GLYPH[took]} home to ${ground}`;
  return null;
}

export function fairMemory(season: Season, gave: ResourceKind | null, took: ResourceKind | null): string {
  const parts = [gave && `brought ${RESOURCE_GLYPH[gave]}`, took && `took ${RESOURCE_GLYPH[took]}`].filter(Boolean);
  return `the ${season} festival fair — ${parts.join(', ')}`;
}
