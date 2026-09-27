/**
 * Dawn chorus (BACKLOG-192) — the order the bowl wakes in. Pure trait math: no Phaser,
 * no AudioContext, no clock. Vitest runs it in Node; WorldScene schedules the chirps.
 *
 * The voices shipped in cycle 44 (chirp.ts); this decides *when* you hear each one. The
 * same `energy` axis that clips a dino's call short now also sets how eagerly it greets
 * the day: the most energetic dino chirps first, the calmest (the grudging night-owl)
 * last, the rest spread across the gap by how energetic they are. So the morning rolls
 * across the cast as a personality read you can hear with your eyes closed.
 */

import type { Personality } from '../ai/personality';
import { chirpParams, pipStrideMs } from './chirp';
import { byTime, type Cue } from './cue';
import { bondPoints, type Bonds } from '../social/bonds';
import { pairKey, type Meetings } from '../social/meetings';
import { isLoner, LONER_FLOOR } from '../world/loner';

/** The dawn boundary — the warm visible dawn (the 07:00 day/night keyframe). */
export const DAWN_HOUR = 7;

/** Total stagger across the whole cast, ms. Short: a desk companion waking, not an alarm. */
export const CHORUS_SPREAD_MS = 1800;

export interface ChorusEntry {
  name: string;
  /** When this dino chirps, ms after the chorus begins. First entry is always 0. */
  delayMs: number;
}

/**
 * The cast ordered by descending energy (early risers first), each with a start delay.
 * Ties in energy break alphabetically by name, so the order is stable across runs.
 * An empty cast yields []; a cast of equal energies all chirp at once (every delay 0).
 */
export function chorusOrder(
  dinos: ReadonlyArray<{ name: string; traits: Personality }>,
): ChorusEntry[] {
  if (dinos.length === 0) return [];
  const sorted = [...dinos].sort(
    (a, b) => b.traits.energy - a.traits.energy || a.name.localeCompare(b.name),
  );
  const eMax = sorted[0].traits.energy;
  const eMin = sorted[sorted.length - 1].traits.energy;
  const span = eMax - eMin || 1; // equal energies → every delay collapses to 0
  return sorted.map((d) => ({
    name: d.name,
    delayMs: Math.round((CHORUS_SPREAD_MS * (eMax - d.traits.energy)) / span),
  }));
}

/**
 * How long after the rest of the chorus has finished the loner comes in (BACKLOG-198). Long enough to
 * hear the quiet first — the whole read is that the others stopped and one more voice went on.
 */
export const LATE_BEAT_MS = 450;

/**
 * How long a ground rests after it has called the keeper in, in-game minutes (three real minutes at the
 * watching rate). An arrival is an event, not a doorbell: walk back and forth across an edge and the
 * ground does not sing every time.
 */
export const ARRIVAL_REST_MIN = 180;

/** The mark that pops over a dino as its cue plays (BACKLOG-566 draws it; the glyph until then). */
export const CALL_ART_KEY = 'call';
export const CALL_GLYPH = '♪';

export interface ShapedChorus {
  cues: Cue[];
  /** Mutual best friends singing together, leader first. */
  pairs: [string, string][];
  /** Loners moved to after the rest, in the order they come in. */
  late: string[];
}

/**
 * The chorus with the bond graph in it (BACKLOG-200 + BACKLOG-198).
 *
 * Starts from `chorusOrder` — energy still decides who greets first — then lets friendship move two
 * kinds of voice. Two singers who are each other's closest friend *among the singers*, over the loner
 * floor, sing as one: the later of the pair moves to half a pip-stride behind the earlier, so their
 * pips alternate rather than stack. And a singer on the outside of the bond graph comes in after
 * everybody else has finished, a beat into the quiet.
 *
 * Closeness is the bond, then the meetings. The tie-break is not decoration: bonds reach their cap of
 * 100 within minutes of ordinary play (measured cycle 170), and past that point a bond-only "closest
 * friend" is decided by the alphabet. The meeting count keeps climbing after the bond stops, so the
 * pair that sings as one is the pair that has actually spent the most time together. (The saturation
 * itself is BACKLOG-567.)
 *
 * `cast` is who the loner read is taken against — the whole park, so the late voice is the same dino
 * the 🥀 hangs over. A chorus of strangers (the founding frame) is left exactly as the energy roll:
 * there is no "rest of the chorus" to be late to.
 */
export function chorusCues(
  singers: ReadonlyArray<{ name: string; traits: Personality }>,
  bonds: Bonds,
  cast: readonly string[] = singers.map((s) => s.name),
  meetings: Meetings = {},
): ShapedChorus {
  const traitsOf = new Map(singers.map((s) => [s.name, s.traits]));
  const at = new Map(chorusOrder(singers).map((e) => [e.name, e.delayMs]));
  const names = [...at.keys()];
  const paramsOf = (n: string) => chirpParams(traitsOf.get(n)!);
  const others = [...cast];
  const closest = (a: string): string | null => {
    let best: string | null = null;
    let score = -1;
    for (const o of names) {
      if (o === a) continue;
      const bond = bondPoints(bonds, a, o);
      if (bond < LONER_FLOOR) continue;
      const s = bond * 1e6 + (meetings[pairKey(a, o)] ?? 0);
      if (s > score || (s === score && best !== null && o < best)) [best, score] = [o, s];
    }
    return best;
  };

  const pairs: [string, string][] = [];
  const paired = new Set<string>();
  for (const a of names) {
    if (paired.has(a)) continue;
    const b = closest(a);
    if (!b || paired.has(b) || closest(b) !== a) continue;
    // `names` is in energy order, so `a` is the leader.
    at.set(b, at.get(a)! + Math.round(pipStrideMs(paramsOf(a)) / 2));
    pairs.push([a, b]);
    paired.add(a).add(b);
  }

  const lonely = names.filter((n) => isLoner(bonds, n, others));
  const late: string[] = [];
  if (lonely.length < names.length) {
    let next = Math.max(
      ...names.filter((n) => !lonely.includes(n)).map((n) => at.get(n)! + paramsOf(n).lengthMs),
    ) + LATE_BEAT_MS;
    for (const n of lonely) {
      at.set(n, next);
      late.push(n);
      next += LATE_BEAT_MS;
    }
  }

  return {
    cues: byTime(names.map((n) => ({ atMs: at.get(n)!, who: n, params: paramsOf(n), kind: 'chirp' as const }))),
    pairs,
    late,
  };
}

/** The ticker's half of an arrival (BACKLOG-200/198) — so a keeper with the sound off still hears it. */
export function chorusLine(groundName: string, pairs: readonly [string, string][], late: readonly string[]): string {
  const clauses = [
    ...pairs.map(([a, b]) => `${a} & ${b} as one`),
    ...(late.length ? [`${late.join(' & ')} a beat behind`] : []),
  ];
  const head = `🎶 ${groundName} calls as you arrive`;
  return clauses.length ? `${head} — ${clauses.join('; ')}` : head;
}

/** Has this ground rested long enough since it last called the keeper in? Never called → yes. */
export function arrivalDue(lastAbsMin: number | undefined, nowAbsMin: number): boolean {
  return lastAbsMin === undefined || nowAbsMin - lastAbsMin >= ARRIVAL_REST_MIN;
}
