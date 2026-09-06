import { describe, it, expect } from 'vitest';
import {
  AWAY_BEAT_MIN_MINUTES,
  apartFor,
  apartLine,
  apartMemory,
  driftFor,
  driftingPairs,
  fastForward,
  COMPANION_MIN_BOND,
  type AwayInput,
} from './away';
import { pairKey } from '../social/meetings';
import type { GameTime } from './clock';

const MIN_PER_DAY = 24 * 60;
const T0: GameTime = { day: 1, hour: 8, minute: 0 };
const away = (bonds: Record<string, number>): AwayInput => ({
  time: T0,
  savedAt: 0,
  scale: 1,
  bonds,
  memory: {},
});
/** `fastForward` takes a real-epoch `now`; at scale 1 one in-game minute is one real minute. */
const run = (minutes: number, bonds: Record<string, number> = {}) =>
  fastForward(away(bonds), minutes * 60_000);

describe('the away curve (BACKLOG-113)', () => {
  it('is silent under AWAY_BEAT_MIN_MINUTES and speaks at it', () => {
    expect(driftFor(AWAY_BEAT_MIN_MINUTES - 1)).toBe(0);
    expect(apartFor(AWAY_BEAT_MIN_MINUTES - 1)).toBe(0);
    expect(driftFor(AWAY_BEAT_MIN_MINUTES)).toBe(1);
    expect(apartFor(AWAY_BEAT_MIN_MINUTES)).toBe(1);
  });

  it('is monotone non-decreasing across a whole week', () => {
    let lastDrift = 0;
    let lastApart = 0;
    for (let m = 0; m <= 7 * MIN_PER_DAY; m += 37) {
      expect(driftFor(m)).toBeGreaterThanOrEqual(lastDrift);
      expect(apartFor(m)).toBeGreaterThanOrEqual(lastApart);
      lastDrift = driftFor(m);
      lastApart = apartFor(m);
    }
  });

  /**
   * The claim the design made in prose — "no day-boundary behaviour changed" — asserted instead of
   * argued. Before this cycle the warm rate was `min(MAX_DRIFT, DRIFT_PER_DAY * days)`; the table below is
   * that expression evaluated for every legal `days`, and `driftFor` has to reproduce it exactly. If a
   * later pass moves the curve and this table stays green, the move was safe at the boundaries; if it
   * reddens, the move changed a number a spec somewhere else is standing on.
   */
  it('reproduces the old per-day drift exactly at every whole-day input', () => {
    const old = [2, 4, 6, 8, 10, 12, 12]; // min(12, 2 * days) for days 1..7
    for (let d = 1; d <= 7; d++) expect(driftFor(d * MIN_PER_DAY)).toBe(old[d - 1]);
  });

  it('caps apart at half the warm cap, and gets there', () => {
    expect(apartFor(7 * MIN_PER_DAY)).toBe(6);
    expect(apartFor(70 * MIN_PER_DAY)).toBe(6);
    expect(apartFor(7 * MIN_PER_DAY)).toBe(driftFor(7 * MIN_PER_DAY) / 2);
  });
});

describe('the drifting band', () => {
  const rexGlade = pairKey('Rex', 'Glade');
  const rexTwitch = pairKey('Rex', 'Twitch');

  it('is bonds above zero and under the companion threshold', () => {
    const pairs = driftingPairs({
      [rexGlade]: COMPANION_MIN_BOND,
      [rexTwitch]: COMPANION_MIN_BOND - 1,
      [pairKey('Glade', 'Twitch')]: 0,
    });
    expect(pairs.map((p) => p.points)).toEqual([COMPANION_MIN_BOND - 1]);
  });

  it('invents no pair for two dinos who have never met', () => {
    expect(driftingPairs({})).toEqual([]);
    expect(driftingPairs({ [rexGlade]: 0 })).toEqual([]);
  });
});

describe('fastForward, the cold half', () => {
  const rexGlade = pairKey('Rex', 'Glade');
  const rexTwitch = pairKey('Rex', 'Twitch');

  it('costs an acquaintance pair apartFor(minutes)', () => {
    const r = run(2 * MIN_PER_DAY, { [rexTwitch]: 5 });
    expect(r.bonds[rexTwitch]).toBe(5 - apartFor(2 * MIN_PER_DAY));
  });

  it('never takes a bond below zero', () => {
    const r = run(7 * MIN_PER_DAY, { [rexTwitch]: 1 });
    expect(r.bonds[rexTwitch]).toBe(0);
  });

  it('leaves the warm path exactly as it was', () => {
    const r = run(3 * MIN_PER_DAY, { [rexGlade]: 20 });
    expect(r.bonds[rexGlade]).toBe(26);
    expect(r.digest.some((l) => l.includes('grew closer'))).toBe(true);
    expect(r.digest.some((l) => l.includes('drifted apart'))).toBe(false);
  });

  it('files a memory for both dinos, in their own direction', () => {
    const r = run(2 * MIN_PER_DAY, { [rexTwitch]: 5 });
    expect(r.memory['Rex']).toContain(apartMemory('Twitch'));
    expect(r.memory['Twitch']).toContain(apartMemory('Rex'));
  });

  it('carries at most two cold lines, furthest-apart first', () => {
    const r = run(2 * MIN_PER_DAY, {
      [pairKey('A', 'B')]: 7,
      [pairKey('C', 'D')]: 4,
      [pairKey('E', 'F')]: 1,
    });
    const cold = r.digest.filter((l) => l.includes('drifted apart'));
    expect(cold).toEqual([apartLine('E', 'F'), apartLine('C', 'D')]);
  });

  it('prints both halves when the cast has each', () => {
    const r = run(2 * MIN_PER_DAY, { [rexGlade]: 20, [rexTwitch]: 5 });
    expect(r.digest.some((l) => l.includes('grew closer'))).toBe(true);
    expect(r.digest.some((l) => l.includes('drifted apart'))).toBe(true);
  });

  it('still says the cast kept to themselves when there is neither', () => {
    const r = run(2 * MIN_PER_DAY, {});
    expect(r.digest.some((l) => l.includes('kept to themselves'))).toBe(true);
  });
});
