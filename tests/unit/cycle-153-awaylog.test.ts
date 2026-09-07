/**
 * BACKLOG-114 — the away-log in the book.
 *
 * Four authors write the homecoming digest and all four write it into a modal the next keypress destroys.
 * These pin the record that outlives it: what is kept, what is refused, and — the one that matters for the
 * hundred existing book literals in this suite — that a book asked for without a log is the book it always
 * was.
 */

import { describe, it, expect } from 'vitest';
import { AWAY_LOG_HEADING, AWAY_LOG_KEPT, awayLogLines, keepAwayLog, type AwayEntry } from '../../game/src/world/awaylog';
import { bookLines, type BookRow } from '../../game/src/ui/lenses';
import { SAVE_VERSION, deserialize, serialize } from '../../game/src/world/saveGame';

const entry = (n: number, lines = [`return ${n}`]): AwayEntry => ({ at: n, minutes: n, lines });

describe('what the book keeps', () => {
  it('keeps at most three returns, newest first', () => {
    let log: AwayEntry[] = [];
    for (let i = 1; i <= 5; i++) log = keepAwayLog(log, entry(i));
    expect(log).toHaveLength(AWAY_LOG_KEPT);
    expect(log.map((e) => e.at)).toEqual([5, 4, 3]);
  });

  it('refuses a return the park had no news about, rather than spending a slot on it', () => {
    const log = keepAwayLog([entry(1)], entry(2, []));
    expect(log.map((e) => e.at)).toEqual([1]);
  });
});

describe('how the block reads', () => {
  it('renders nothing at all for a park nobody has ever left — not a heading over blank space', () => {
    expect(awayLogLines([])).toEqual([]);
  });

  it('puts the newest return first and divides it from the one before', () => {
    const out = awayLogLines([entry(2, ['b']), entry(1, ['a'])]);
    expect(out[0]).toBe(AWAY_LOG_HEADING);
    expect(out).toContain('  b');
    expect(out).toContain('  a');
    expect(out.indexOf('  b')).toBeLessThan(out.indexOf('  a'));
    expect(out.filter((l) => l.trim() === '·')).toHaveLength(1);
  });
});

describe('the book that predates the log', () => {
  const row: BookRow = {
    name: 'Rex',
    species: 'tyrannosaur',
    hearts: 3,
    topBond: 20,
    role: 'wanderer',
    rumorsHeard: 0,
  };

  it('is byte-identical when no log is passed — every existing call site keeps working', () => {
    expect(bookLines([row])).toEqual(bookLines([row], []));
    expect(bookLines([row])[1]).toContain('Rex');
  });

  it('puts the log between the header and the first dino when there is one', () => {
    const lines = bookLines([row], [AWAY_LOG_HEADING, '  the bowl ran on']);
    expect(lines[0]).toBe('— Collection Book —');
    expect(lines[1]).toBe(AWAY_LOG_HEADING);
    expect(lines.findIndex((l) => l.includes('Rex'))).toBeGreaterThan(2);
  });
});

describe('the away-log in the save (BACKLOG-114)', () => {
  const base = {
    version: SAVE_VERSION,
    time: { day: 1, hour: 8, minute: 0 },
    player: { x: 0, y: 0 },
    friendship: {},
    memory: {},
    bonds: {},
  };

  it('round-trips, because re-readable means tomorrow and not just before the next keypress', () => {
    const awayLog = [{ at: 1700, minutes: 90, lines: ['The bowl ran on for 1 hour.', 'Rex and Sunny grew closer.'] }];
    expect(deserialize(serialize({ ...base, awayLog } as any))?.awayLog).toEqual(awayLog);
  });

  it('loads a save written before this cycle with no field at all', () => {
    const out = deserialize(serialize(base as any));
    expect(out).not.toBeNull();
    expect(out?.awayLog).toBeUndefined();
  });

  it('refuses a malformed log rather than loading half of one', () => {
    expect(deserialize(serialize({ ...base, awayLog: 'nope' } as any))).toBeNull();
    expect(deserialize(serialize({ ...base, awayLog: [{ at: 'x', minutes: 1, lines: [] }] } as any))).toBeNull();
    expect(deserialize(serialize({ ...base, awayLog: [{ at: 1, minutes: 1, lines: [7] }] } as any))).toBeNull();
  });
});
