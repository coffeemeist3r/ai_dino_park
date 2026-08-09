/**
 * Traces of your pacing (BACKLOG-424) — a private ritual leaves a mark someone else can stumble on.
 *
 * Since 405 every dino has had a signature tic keyed to its most-pronounced trait, and 408/413/414 gave the
 * keeper three different ways to catch one mid-ritual. In all of it, exactly one observer has ever known a
 * dino paces: the player. 407 was seeded to fix that by having a dino *watch* another mid-tic, and it is
 * unbuildable by construction — `undisturbed` (405) requires no company within `TIC_COMPANY_RANGE`, so a
 * witness ends the very thing it would witness.
 *
 * This is the re-shape that respects that gate. Nobody watches. The **ground** remembers: a dino that falls
 * into its ritual scuffs the spot, and a dino that wanders across that spot while the mark is still fresh
 * files a faint, *unnamed* trace. The anonymity is the design and not a shortcut — "someone was pacing here"
 * is exactly as much as a patch of trodden grass can honestly tell you, and a named witness is the thing 407
 * proved impossible. What the park gets out of it is a first: a *place* holding a memory of a dino, rather
 * than a dino holding a memory of a place.
 *
 * Pure TypeScript (no Phaser, no clock, no `Math.random()`): Node-testable. The `at` stamp is a world-step
 * count the caller owns, so freshness is measured in the same units as the tic onset it descends from.
 * Traces are deliberately **transient** — like every other piece of 405 tic state, they are re-derived from
 * live behaviour and never saved.
 */

export interface PaceTrace {
  zone: string;
  tileX: number;
  tileY: number;
  /** Who left it. Read only to exclude the pacer itself — never surfaced to the player. */
  by: string;
  /** The world step it was left on. */
  at: number;
}

/**
 * How many world steps a scuffed spot stays worth noticing. 40 ≈ 2× `TIC_AFTER_STEPS` (405), so the window
 * is about as long as the solitude it took to make the mark — the calibration knob, tuned here and nowhere
 * else. Long enough that a wanderer plausibly crosses it; short enough that "lately" stays true.
 */
export const TRACE_FRESH_STEPS = 40;

/** How close counts as standing on it — the 8-neighbourhood plus the tile itself. */
export const TRACE_RADIUS = 1;

/** The mark a dino floats when it reads the ground. */
export const TRACE_GLYPH = '👣';

/**
 * Record a trace, replacing any the same dino already left. One live mark per pacer: a dino that re-invents
 * its ritual has moved its ritual, not littered the zone with every spot it ever stood in.
 */
export function recordTrace(list: readonly PaceTrace[], t: PaceTrace): PaceTrace[] {
  return [...list.filter((x) => x.by !== t.by), t];
}

/** The traces still worth noticing at `now`. */
export function freshTraces(list: readonly PaceTrace[], now: number): PaceTrace[] {
  return list.filter((t) => now - t.at <= TRACE_FRESH_STEPS && now >= t.at);
}

/**
 * The trace `by` is standing on, or null. Same zone, within `TRACE_RADIUS`, still fresh, and left by someone
 * else — a dino never reads its own scuff. Freshest wins (later `at`), list order breaking a tie, so the
 * result is deterministic without a sort key.
 */
export function traceNear(
  list: readonly PaceTrace[],
  zone: string,
  tile: { tileX: number; tileY: number },
  by: string,
  now: number,
): PaceTrace | null {
  let best: PaceTrace | null = null;
  for (const t of freshTraces(list, now)) {
    if (t.by === by || t.zone !== zone) continue;
    if (Math.abs(t.tileX - tile.tileX) > TRACE_RADIUS || Math.abs(t.tileY - tile.tileY) > TRACE_RADIUS) continue;
    if (!best || t.at > best.at) best = t;
  }
  return best;
}

/** The faint memory the finder files. Names nobody — that is the whole point of the beat. */
export function traceMemory(): string {
  return 'the ground here was scuffed and trodden — someone had been pacing this spot, not long ago';
}

/** The once-per-trace-per-finder guard key: a trace is one *event*, not a tile that re-fires every step. */
export function traceKey(t: PaceTrace): string {
  return `${t.by}:${t.at}`;
}
