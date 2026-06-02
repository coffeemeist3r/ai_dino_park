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
 * The simulated span is capped (MAX_AWAY_DAYS) so a week-long absence rolls
 * forward instantly instead of hanging the load. Rich per-dino beats (missed-you
 * memory, drift-apart, night-owl weighting) are deliberate follow-ups
 * (BACKLOG-113/115/116) that build on this spine.
 */

import { advanceTime, type GameTime } from './clock';
import { strengthen, type Bonds } from '../social/bonds';
import { bondedPairs } from '../ui/lenses';
import { remember, type MemoryStore } from '../ai/memory';

const MINUTES_PER_DAY = 24 * 60;
/** Cap on simulated away span. A longer gap still advances the clock but its effects stop here. */
export const MAX_AWAY_DAYS = 7;
const MAX_AWAY_MINUTES = MAX_AWAY_DAYS * MINUTES_PER_DAY;
/** Min bond for a pair to count as "keeping each other company" — mirrors WorldScene HUDDLE_THRESHOLD. */
const COMPANION_MIN_BOND = 8;
const DRIFT_PER_DAY = 2;
const MAX_DRIFT = 12;

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

  if (days >= 1) {
    const drift = Math.min(DRIFT_PER_DAY * days, MAX_DRIFT);
    const pairs = bondedPairs(bonds, COMPANION_MIN_BOND);
    for (const p of pairs) {
      bonds = strengthen(bonds, p.a, p.b, drift);
      memory = remember(memory, p.a, `while the keeper was away, you and ${p.b} kept each other company`);
      memory = remember(memory, p.b, `while the keeper was away, you and ${p.a} kept each other company`);
    }
    if (pairs.length) {
      // bondedPairs returns descending by bond, so the first two are the strongest companions.
      for (const p of bondedPairs(bonds, COMPANION_MIN_BOND).slice(0, 2)) {
        digest.push(`${p.a} and ${p.b} grew closer.`);
      }
    } else {
      digest.push('The cast kept to themselves.');
    }
  } else {
    digest.push('Barely long enough to notice.');
  }

  return { minutes, days, capped, time, bonds, memory, digest };
}
