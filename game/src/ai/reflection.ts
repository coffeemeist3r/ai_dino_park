/**
 * The dusk reflection (BACKLOG-583, first slice of 014) — a day summed into a record tomorrow reads.
 *
 * At the dusk turn every dino folds its day into `{ day, best, met }`: the dino it met most since dawn and how many
 * meetings it had, diffed from the meetings ledger against a dawn snapshot. Persisted (additive save field). Tomorrow's
 * plan reads it (a sociable dino that spent its day alone wakes wanting company) and so does the companion chooser
 * (BACKLOG-582 seeks yesterday's `best`). Deterministic; no model needed. It stays out of the six-slot memory ring on
 * purpose — the hatch reads that ring and a daily line would push its beats off the end (581).
 *
 * Pure TypeScript (no Phaser, no WebLLM): Node-testable.
 */

import { bondPoints, closestFriend, type Bonds } from '../social/bonds';
import { pairKey } from '../social/meetings';
import { type Personality } from './personality';
import { type DayPlan } from './plan';

export interface Reflection {
  /** The in-game day this reflection sums. */
  day: number;
  /** Who it spent the day with — the dino it met most — or null for a day alone. */
  best: string | null;
  /** How many meetings it had that day. */
  met: number;
}

export type Reflections = Record<string, Reflection>;

/** The hour the park thinks back on its day: the turn into dusk. */
export const REFLECT_HOUR = 17;
export const REFLECT_GLYPH = '💭';

/** A dino at or above this sociability misses company after a day alone. */
export const MISSES_COMPANY = 0.5;

/** Sum `name`'s day: meetings since the dawn snapshot, per partner. Ties go to the warmer bond, then the name. */
export function reflectDay(
  name: string,
  day: number,
  meetingsNow: Record<string, number>,
  meetingsAtDawn: Record<string, number>,
  others: readonly string[],
  bonds: Bonds,
): Reflection {
  let best: string | null = null;
  let bestN = 0;
  let met = 0;
  for (const o of [...others].sort()) {
    if (o === name) continue;
    const key = pairKey(name, o);
    const n = (meetingsNow[key] ?? 0) - (meetingsAtDawn[key] ?? 0);
    if (n <= 0) continue;
    met += n;
    if (n > bestN || (n === bestN && best !== null && bondPoints(bonds, name, o) > bondPoints(bonds, name, best))) {
      best = o;
      bestN = n;
    }
  }
  return { day, best, met };
}

/** The founding park's yesterday: a dino with a founding friend spent it with that friend; a dino with none, none. */
export function foundingReflection(name: string, day: number, bonds: Bonds, others: readonly string[]): Reflection | null {
  const best = closestFriend(name, bonds, [...others], 1);
  return best ? { day, best, met: 1 } : null;
}

/** Tomorrow's plan after yesterday: a sociable dino whose day was empty spends today's daytime looking for company. */
export function planAfter(plan: DayPlan, r: Reflection | undefined, traits: Personality, today: number): DayPlan {
  if (!r || r.day !== today - 1 || r.met > 0 || traits.sociability < MISSES_COMPANY) return plan;
  return { ...plan, day: 'social' };
}

/** The book's "yesterday:" line. */
export function reflectionLine(r: Reflection): string {
  return r.best ? `spent it with ${r.best}` : 'kept to itself';
}

/** The one dusk ticker line: who spent the day with whom, and who spent it alone. */
export function duskLine(today: Reflections, names: readonly string[]): string {
  const pairs: string[] = [];
  const seen = new Set<string>();
  const alone: string[] = [];
  for (const n of names) {
    const r = today[n];
    if (!r) continue;
    if (!r.best) {
      alone.push(n);
      continue;
    }
    const key = pairKey(n, r.best);
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push(today[r.best]?.best === n ? `${n} & ${r.best}` : `${n} with ${r.best}`);
  }
  const parts = [pairs.join(', '), alone.length ? `${alone.join(', ')} alone` : ''].filter(Boolean);
  return `${REFLECT_GLYPH} Dusk — the park thinks back on its day: ${parts.join('; ') || 'nothing much'}.`;
}

/** Save parse: one entry, or null when malformed. */
export function parseReflection(raw: unknown): Reflection | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const { day, best, met } = raw as { day?: unknown; best?: unknown; met?: unknown };
  if (typeof day !== 'number' || !Number.isFinite(day)) return null;
  if (best !== null && typeof best !== 'string') return null;
  if (typeof met !== 'number' || !Number.isFinite(met) || met < 0) return null;
  return { day: Math.floor(day), best, met: Math.floor(met) };
}
