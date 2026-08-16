import { describe, it, expect } from 'vitest';
import { heldSeats, reseat, sameSeats, turnoverLine, type Seating } from './term';

/**
 * The seat has a term (BACKLOG-484). The assertions that matter are the two the codeplan flagged as the
 * whole risk: `null` is not `[]` (a ground with no term reads live, not "seats nobody"), and a reseat holds
 * the *order* even when it reports nothing, so 481's `votes[0]` tie-break cannot flip mid-term.
 */
describe('heldSeats — null is not empty', () => {
  it('answers null for a ground with no held seating', () => {
    expect(heldSeats(null, 'bowl')).toBeNull();
    expect(heldSeats({ seats: { grove: ['A'] }, day: 3 }, 'bowl')).toBeNull();
  });

  it('answers [] for a ground that is held and seats nobody', () => {
    expect(heldSeats({ seats: { bowl: [] }, day: 3 }, 'bowl')).toEqual([]);
  });

  it('copies, so a caller cannot mutate the held seating', () => {
    const held: Seating = { seats: { bowl: ['A', 'B'] }, day: 1 };
    heldSeats(held, 'bowl')!.push('C');
    expect(held.seats.bowl).toEqual(['A', 'B']);
  });
});

describe('sameSeats — membership, not order', () => {
  it('is order-insensitive', () => {
    expect(sameSeats(['A', 'B', 'C'], ['C', 'A', 'B'])).toBe(true);
  });

  it('separates different sets and different lengths', () => {
    expect(sameSeats(['A', 'B'], ['A', 'C'])).toBe(false);
    expect(sameSeats(['A', 'B'], ['A'])).toBe(false);
    expect(sameSeats([], [])).toBe(true);
  });
});

describe('reseat', () => {
  it('reports a first seating, which the caller records silently', () => {
    const { seating, changes } = reseat(null, { bowl: ['A', 'B'] }, 4);
    expect(changes).toEqual([{ zone: 'bowl', kind: 'first', seated: ['A', 'B'], before: [] }]);
    expect(seating).toEqual({ seats: { bowl: ['A', 'B'] }, day: 4 });
  });

  it('does not report a ground that seats nobody and never has', () => {
    expect(reseat(null, { bowl: [] }, 1).changes).toEqual([]);
  });

  it('reports a turnover when the membership changes', () => {
    const held: Seating = { seats: { bowl: ['A', 'B'] }, day: 4 };
    const { changes } = reseat(held, { bowl: ['C', 'A'] }, 5);
    expect(changes).toEqual([{ zone: 'bowl', kind: 'turnover', seated: ['C', 'A'], before: ['A', 'B'] }]);
  });

  it('reports a council emptying as a turnover', () => {
    const { changes } = reseat({ seats: { bowl: ['A'] }, day: 1 }, { bowl: [] }, 2);
    expect(changes[0]).toMatchObject({ kind: 'turnover', seated: [] });
  });

  it('reports nothing when the membership is unchanged — but still holds the fresh order', () => {
    const held: Seating = { seats: { bowl: ['A', 'B', 'C'] }, day: 4 };
    const { seating, changes } = reseat(held, { bowl: ['B', 'C', 'A'] }, 5);
    expect(changes).toEqual([]); // no beat: the same three dinos still sit
    expect(seating.seats.bowl).toEqual(['B', 'C', 'A']); // ...but the tie-break follows the new banking
    expect(seating.day).toBe(5);
  });

  it('judges each ground on its own', () => {
    const held: Seating = { seats: { bowl: ['A'], grove: ['B'] }, day: 1 };
    const { changes } = reseat(held, { bowl: ['A'], grove: ['C'], ridge: ['D'] }, 2);
    expect(changes.map((c) => `${c.zone}:${c.kind}`)).toEqual(['grove:turnover', 'ridge:first']);
  });

  it('does not alias the fresh seats it was handed', () => {
    const fresh = { bowl: ['A'] };
    const { seating } = reseat(null, fresh, 1);
    fresh.bowl.push('B');
    expect(seating.seats.bowl).toEqual(['A']);
  });
});

describe('turnoverLine', () => {
  it('names the ground and the new seats, on the council’s existing mark', () => {
    const line = turnoverLine('Grove', ['Sunny', 'Rex']);
    expect(line).toContain('Grove');
    expect(line).toContain('Sunny, Rex');
    expect(line.startsWith('🗳️')).toBe(true);
  });

  it('says so when a council empties rather than trailing off', () => {
    expect(turnoverLine('Grove', [])).toContain('nobody');
  });
});
