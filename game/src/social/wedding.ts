/**
 * The wedding (BACKLOG-625, Milestone 34). Pure TypeScript (no Phaser): Node-testable.
 *
 * Once a pair has formed, at `WEDDING_HOUR` it is wed at its nest, once. Its friends on that ground walk over and stand
 * round it for `WEDDING_MIN`. WorldScene owns the cadence and the walk; the day is a save field on the pair.
 */

import type { GameTime } from '../world/clock';
import { bondPoints, type Bonds } from './bonds';
import type { Pairs } from './courtship';

export const WEDDING_HOUR = 15;
export const WEDDING_MIN = 60;
export const GUEST_BOND = 10;
export const WED_GLYPH = '💍';
/** `PROP_RIGS` key for the mark set down at the nest (BACKLOG-626); `💍` until it is drawn. */
export const WEDDING_ART_KEY = 'wedding';

/** The first unwed pair (by name) with a nest, formed on or before today, in the wedding hour. */
export function weddingDue(t: GameTime, pairs: Pairs): [string, string] | null {
  if (t.hour !== WEDDING_HOUR) return null;
  for (const name of Object.keys(pairs).sort()) {
    const p = pairs[name];
    if (name < p.mate && p.nest && p.wed === undefined && p.day <= t.day) return [name, p.mate];
  }
  return null;
}

export interface Present {
  name: string;
  zone: string;
  awake: boolean;
  migrating: boolean;
}

export function settledOn(p: Present | undefined, zone: string): boolean {
  return !!p && p.zone === zone && p.awake && !p.migrating;
}

/** Every awake, settled dino on the nest's ground that is a friend of either mate. */
export function weddingGuests(a: string, b: string, zone: string, present: readonly Present[], bonds: Bonds): string[] {
  return present
    .filter((p) => p.name !== a && p.name !== b && settledOn(p, zone))
    .filter((p) => Math.max(bondPoints(bonds, p.name, a), bondPoints(bonds, p.name, b)) >= GUEST_BOND)
    .map((p) => p.name);
}

export function wed(pairs: Pairs, a: string, b: string, day: number): Pairs {
  return { ...pairs, [a]: { ...pairs[a], wed: day }, [b]: { ...pairs[b], wed: day } };
}

function list(names: readonly string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

export function weddingTicker(a: string, b: string, guests: readonly string[]): string {
  const came = guests.length ? `${list(guests)} came.` : 'with nobody there but each other.';
  return guests.length ? `${WED_GLYPH} ${a} and ${b} are wed at their nest. ${came}` : `${WED_GLYPH} ${a} and ${b} are wed at their nest, ${came}`;
}

export function mateWeddingMemory(mate: string): string {
  return `I was wed to ${mate} at our nest`;
}

export function guestWeddingMemory(a: string, b: string): string {
  return `I stood at ${a} and ${b}'s wedding`;
}

export function weddingClosedLine(a: string, b: string): string {
  return `${WED_GLYPH} The guests drift home from ${a} and ${b}'s nest.`;
}
