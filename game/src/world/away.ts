/**
 * Offline catch-up (BACKLOG-106) — "while you were away".
 *
 * Pure (no Phaser, no WebLLM): given the saved clock time, the real `savedAt`
 * epoch, the saved `scale`, and the current bonds + memory, work out how much
 * in-game time really elapsed and roll the world forward *cheaply* — no per-tick
 * loop, no inference (CHARTER: procedural summaries, never thousands of LLM
 * calls). Bonded pairs that keep each other company drift a little closer and
 * leave a faint memory; a short `digest` narrates the homecoming.
 *
 * **`savedAt` is a duration input, not a clock reading (BACKLOG-529).** Everything this module does with a
 * real timestamp is subtraction — how long the keeper was gone — and a duration is timezone-free, unmoved by
 * DST, and correct as it stands. An *hour-of-day* is a different kind of reading, and it lives in
 * `keeperclock.ts`. The distinction is written here because this is the file somebody reaches for when they
 * next need "what time was that", and the answer is: not here.
 *
 * The simulated span is capped (MAX_AWAY_DAYS) so a week-long absence rolls
 * forward instantly instead of hanging the load. Rich per-dino beats (missed-you
 * memory, drift-apart, night-owl weighting) are deliberate follow-ups
 * (BACKLOG-113/115/116) that build on this spine.
 */

import { advanceTime, type GameTime } from './clock';
import { strengthen, type Bonds } from '../social/bonds';
import { bondedPairs } from '../ui/lenses';
import { remember, type MemoryStore } from '../ai/memory';
import { MISSED_MIN_MINUTES } from './missed';

const MINUTES_PER_DAY = 24 * 60;
/** Cap on simulated away span. A longer gap still advances the clock but its effects stop here. */
export const MAX_AWAY_DAYS = 7;
const MAX_AWAY_MINUTES = MAX_AWAY_DAYS * MINUTES_PER_DAY;
/** Min bond for a pair to count as "keeping each other company" — mirrors WorldScene HUDDLE_THRESHOLD. */
export const COMPANION_MIN_BOND = 8;
const DRIFT_PER_DAY = 2;
const MAX_DRIFT = 12;

/**
 * How far apart an acquaintance pair comes back, per in-game day, and the most it can ever lose
 * (BACKLOG-113).
 *
 * Both are **half** the warm rates on purpose. This park is deathless and cozy by charter, so coming apart
 * is slower than coming together: a falling-out is a nudge the keeper can undo in one visit, not a
 * punishment that outruns them. And `strengthen` clamps at 0, so a bond is never a wound — the worst an
 * absence can do to two dinos is return them to strangers.
 */
const APART_PER_DAY = 1;
const MAX_APART = 6;

/**
 * The gap at which any away beat happens at all, in in-game minutes.
 *
 * **Imported from `missed.ts` rather than chosen here**, and that is the whole reachability fix of
 * BACKLOG-113. Until this cycle every drift beat in this module was gated on `days >= 1`, and an offline
 * gap replays at `AWAY_SCALE = 1` — so one in-game day is *twenty-four real hours away*, and in a fresh
 * save watched for ten minutes, or a hundred, the homecoming digest had never printed anything but
 * "Barely long enough to notice." The catch-up's whole warm half has been unreachable since cycle 29.
 *
 * `missed.ts` faced this exact question one cycle ago and wrote down the answer: a threshold tuned so the
 * shipping park sits under it is the defect CHARTER v7's corollary names. The same absence should not be
 * long enough for one system and too short for another, so this is that constant, not a second copy of it.
 */
export const AWAY_BEAT_MIN_MINUTES = MISSED_MIN_MINUTES;

/**
 * A per-day rate, asked about a span measured in minutes.
 *
 * `ceil` is doing the reachability work: it is what turns a five-minute step away into one point of
 * movement instead of zero. At every **whole-day** input it lands on exactly the integer
 * `rate * days` gave before this cycle (an integer's ceiling is itself), so no day-boundary behaviour
 * changed — `cycle-152-drift.test.ts` pins that for days 1 through 7 rather than leaving it as a claim in
 * a comment.
 */
function perMinute(rate: number, cap: number, minutes: number): number {
  if (minutes < AWAY_BEAT_MIN_MINUTES) return 0;
  return Math.min(cap, Math.ceil((rate * minutes) / MINUTES_PER_DAY));
}

/** How much closer a companion pair comes back, for an absence of `minutes`. */
export function driftFor(minutes: number): number {
  return perMinute(DRIFT_PER_DAY, MAX_DRIFT, minutes);
}

/** How much further apart an acquaintance pair comes back, for an absence of `minutes`. */
export function apartFor(minutes: number): number {
  return perMinute(APART_PER_DAY, MAX_APART, minutes);
}

/**
 * The pairs that know each other and keep no company — a bond above zero and under the companion
 * threshold. The band the whole item is about: the friendship the player *started* and did not finish.
 *
 * Strangers (bond 0, or no entry at all) are excluded by the floor of 1 and stay excluded, because a park
 * that invents estrangement between two dinos who have never met is inventing drama rather than reporting
 * it. Built off `bondedPairs`, which already walks `Bonds` once and returns it sorted descending, so this
 * is a filter rather than a second traversal.
 */
export function driftingPairs(bonds: Bonds): Array<{ a: string; b: string; points: number }> {
  return bondedPairs(bonds, 1).filter((p) => p.points < COMPANION_MIN_BOND);
}

/** The memory a drifted dino files about the other one. One builder, not a template literal at the call
 *  site (the BACKLOG-483 rule `missed.ts` follows) — two modules read this string back out. */
export function apartMemory(other: string): string {
  return `while the keeper was away, you and ${other} had nothing to say to each other`;
}

/** The digest's cold line, the counterpart to "grew closer". */
export function apartLine(a: string, b: string): string {
  return `${a} and ${b} drifted apart.`;
}

export interface AwayInput {
  time: GameTime;
  savedAt?: number;
  scale?: number;
  bonds: Bonds;
  memory: MemoryStore;
}

export interface AwayResult {
  /** in-game minutes the world advanced (after the cap). */
  minutes: number;
  /** whole in-game days within the (capped) span. */
  days: number;
  /** true when the real gap exceeded the cap and the overflow was skipped. */
  capped: boolean;
  time: GameTime;
  bonds: Bonds;
  memory: MemoryStore;
  /** homecoming lines; empty when no in-game time elapsed. */
  digest: string[];
}

/** In-game minutes that really elapsed while away, before the cap. 0 when there's no anchor. */
export function awayMinutes(savedAt: number | undefined, scale: number | undefined, nowMs: number): number {
  if (savedAt === undefined) return 0;
  const realMs = nowMs - savedAt;
  if (realMs <= 0) return 0;
  const s = scale && scale > 0 ? scale : 1;
  return Math.floor((realMs * s) / 60_000);
}

function fmtSpan(minutes: number): string {
  const d = Math.floor(minutes / MINUTES_PER_DAY);
  const h = Math.floor((minutes % MINUTES_PER_DAY) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d} day${d === 1 ? '' : 's'}`);
  if (h) parts.push(`${h} hour${h === 1 ? '' : 's'}`);
  if (!parts.length) parts.push('a little while');
  return parts.join(' ');
}

export function fastForward(input: AwayInput, nowMs: number): AwayResult {
  const raw = awayMinutes(input.savedAt, input.scale, nowMs);
  const capped = raw > MAX_AWAY_MINUTES;
  const minutes = Math.min(raw, MAX_AWAY_MINUTES);
  const time = advanceTime(input.time, minutes);

  if (minutes <= 0) {
    return { minutes: 0, days: 0, capped: false, time, bonds: input.bonds, memory: input.memory, digest: [] };
  }

  const days = Math.floor(minutes / MINUTES_PER_DAY);
  let bonds = input.bonds;
  let memory = input.memory;
  const digest: string[] = [`The bowl ran on for ${fmtSpan(minutes)}${capped ? ' (and then some)' : ''}.`];

  const drift = driftFor(minutes);
  const apart = apartFor(minutes);

  if (drift > 0 || apart > 0) {
    const warm = bondedPairs(bonds, COMPANION_MIN_BOND);
    for (const p of warm) {
      bonds = strengthen(bonds, p.a, p.b, drift);
      memory = remember(memory, p.a, `while the keeper was away, you and ${p.b} kept each other company`);
      memory = remember(memory, p.b, `while the keeper was away, you and ${p.a} kept each other company`);
    }

    // BACKLOG-113: the cold half. Read the band off the bonds as they were *before* the warm pass, so a
    // pair cannot be counted twice — `strengthen` above can lift nobody across the threshold (it only
    // touches pairs already over it), but the read order is the thing that guarantees that rather than an
    // argument about it.
    const cold = driftingPairs(input.bonds);
    for (const p of cold) {
      bonds = strengthen(bonds, p.a, p.b, -apart);
      memory = remember(memory, p.a, apartMemory(p.b));
      memory = remember(memory, p.b, apartMemory(p.a));
    }

    if (warm.length) {
      // bondedPairs returns descending by bond, so the first two are the strongest companions.
      for (const p of bondedPairs(bonds, COMPANION_MIN_BOND).slice(0, 2)) {
        digest.push(`${p.a} and ${p.b} grew closer.`);
      }
    }
    // The furthest-apart pair leads — `driftingPairs` is descending by bond, so the tail is the faintest
    // acquaintance, which is the one the absence cost the most.
    for (const p of cold.slice(-2).reverse()) digest.push(apartLine(p.a, p.b));

    if (!warm.length && !cold.length) digest.push('The cast kept to themselves.');
  } else {
    digest.push('Barely long enough to notice.');
  }

  return { minutes, days, capped, time, bonds, memory, digest };
}
