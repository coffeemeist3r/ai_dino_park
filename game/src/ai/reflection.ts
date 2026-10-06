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
import { hashSeed, mulberry32, type Personality } from './personality';
import { PRICKLY } from './companion';
import { type DayPlan } from './plan';

export interface Reflection {
  /** The in-game day this reflection sums. */
  day: number;
  /** Who it spent the day with — the dino it met most — or null for a day alone. */
  best: string | null;
  /** How many meetings it had that day. */
  met: number;
  /** The ground it went to on purpose that day (BACKLOG-586), if any. */
  went?: string;
  /** How it says the day went, in its own voice (BACKLOG-585). */
  said?: string;
}

export type Reflections = Record<string, Reflection>;

/** The hour the park thinks back on its day: the turn into dusk. */
export const REFLECT_HOUR = 17;
export const REFLECT_GLYPH = '💭';
export const REFLECT_ART_KEY = 'reflect';

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

/** The book's "yesterday:" line, with what it said about it. */
export function reflectionLine(r: Reflection): string {
  const gist = r.best ? `spent it with ${r.best}` : 'kept to itself';
  return r.said ? `${gist} — "${r.said}"` : gist;
}

/** A dino at or above this agreeableness is glad of its company out loud. */
export const WARM = 0.6;

type Mood = 'rivalSour' | 'rivalWary' | 'glad' | 'grudging' | 'plain' | 'lonely' | 'content';

/** Two ways to say each day, so two dinos with the same day can still sound different. `@` is the companion. */
const VOICE: Record<Mood, readonly [string, string]> = {
  rivalSour: ['@. All day. Of course it was @.', "Spent the whole day with @. I wasn't backing down."],
  rivalWary: ['@ again. I kept one eye open.', 'Another day near @. Could have gone worse.'],
  glad: ['A good day. @ was there for most of it.', "Me and @, all day. I'd do it again."],
  grudging: ['Spent it with @. Fine.', '@ followed me about. I let it.'],
  plain: ['Mostly with @ today.', '@ and me. A day like any other.'],
  lonely: ["Nobody today. I'll find someone tomorrow.", "Quiet. Too quiet. Tomorrow I'm going looking."],
  content: ['A quiet day. Just how I like it.', 'Nobody bothered me. Good.'],
};

/**
 * How `name` says its day went (BACKLOG-585) — the persona-seeded floor. The mood reads off the day and who the dino
 * is: a rival day sours a prickly dino and puts anyone else on guard; company gladdens a warm dino and is merely put up with by
 * a prickly one; a day alone is lonely for a sociable dino (and 583's `planAfter` makes its promise true) and content
 * for anyone else. A day with a destination leads with it.
 */
export function dayVoice(name: string, traits: Personality, r: Reflection, rival: boolean): string {
  let mood: Mood;
  if (!r.best) mood = traits.sociability >= MISSES_COMPANY ? 'lonely' : 'content';
  else if (rival) mood = traits.agreeableness < PRICKLY ? 'rivalSour' : 'rivalWary';
  else if (traits.agreeableness >= WARM) mood = 'glad';
  else if (traits.agreeableness < PRICKLY) mood = 'grudging';
  else mood = 'plain';
  const line = VOICE[mood][mulberry32(hashSeed(`${name}#voice`))() < 0.5 ? 0 : 1].replaceAll('@', r.best ?? '');
  return r.went ? `Went all the way to ${r.went}. ${line}` : line;
}

/** A plain account of the day for the model to say in the dino's voice (BACKLOG-585). */
export function daySummary(r: Reflection, rival: boolean): string {
  const who = r.best
    ? `You spent most of today with ${r.best}${rival ? ', a dino you have a grudge against' : ''}.`
    : 'You spent today without company.';
  return r.went ? `${who} You went to ${r.went}.` : who;
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
  const { day, best, met, went, said } = raw as { day?: unknown; best?: unknown; met?: unknown; went?: unknown; said?: unknown };
  if (typeof day !== 'number' || !Number.isFinite(day)) return null;
  if (best !== null && typeof best !== 'string') return null;
  if (typeof met !== 'number' || !Number.isFinite(met) || met < 0) return null;
  const r: Reflection = { day: Math.floor(day), best, met: Math.floor(met) };
  if (typeof went === 'string') r.went = went; // BACKLOG-586
  if (typeof said === 'string') r.said = said; // BACKLOG-585
  return r;
}
