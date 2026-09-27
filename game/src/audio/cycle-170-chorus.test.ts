import { describe, it, expect } from 'vitest';
import { chorusCues, chorusLine, chorusOrder, arrivalDue, ARRIVAL_REST_MIN, LATE_BEAT_MS } from './chorus';
import { chirpParams, pipStrideMs } from './chirp';
import { strengthen, type Bonds } from '../social/bonds';
import { pairKey } from '../social/meetings';
import { LONER_FLOOR } from '../world/loner';
import type { Personality } from '../ai/personality';

/**
 * BACKLOG-200 + BACKLOG-198 — friendship you can hear in a crowd.
 *
 * Hand-built traits so the energy order is fixed and legible: A is the earliest riser, E the latest.
 * Agreeableness is high so every call has several pips — the interleave needs pips to fall between.
 */

const t = (energy: number): Personality => ({ curiosity: 0.5, sociability: 0.5, energy, agreeableness: 0.9, bravery: 0.5 });
const cast = [
  { name: 'A', traits: t(0.9) },
  { name: 'B', traits: t(0.7) },
  { name: 'C', traits: t(0.5) },
  { name: 'D', traits: t(0.3) },
  { name: 'E', traits: t(0.1) },
];
const bond = (b: Bonds, x: string, y: string, n: number) => strengthen(b, x, y, n);
const atOf = (r: ReturnType<typeof chorusCues>, n: string) => r.cues.find((c) => c.who === n)!.atMs;

describe('chorusCues', () => {
  it('a chorus of strangers is exactly the energy roll', () => {
    const r = chorusCues(cast, {});
    expect(r.pairs).toEqual([]);
    expect(r.late).toEqual([]);
    for (const e of chorusOrder(cast)) expect(atOf(r, e.name)).toBe(e.delayMs);
  });

  it('mutual best friends sing as one — the later half a stride behind, between the leader’s pips', () => {
    let b: Bonds = {};
    b = bond(b, 'A', 'D', LONER_FLOOR + 4);
    b = bond(b, 'B', 'C', LONER_FLOOR);
    b = bond(b, 'E', 'B', LONER_FLOOR - 1); // E stays a loner; B's best is still C
    const r = chorusCues(cast, b);
    expect(r.pairs).toEqual([['A', 'D'], ['B', 'C']]);

    const lead = chirpParams(cast[0].traits);
    const stride = pipStrideMs(lead);
    expect(Math.abs(atOf(r, 'D') - (atOf(r, 'A') + stride / 2))).toBeLessThanOrEqual(1);
    expect(lead.notes).toBeGreaterThanOrEqual(2);
    // the partner's first pip lands strictly between the leader's pip 0 and pip 1
    expect(atOf(r, 'D')).toBeGreaterThan(atOf(r, 'A'));
    expect(atOf(r, 'D')).toBeLessThan(atOf(r, 'A') + stride);
  });

  it('one-sided closeness is not a pair', () => {
    let b: Bonds = {};
    b = bond(b, 'A', 'B', LONER_FLOOR); // A's best is B…
    b = bond(b, 'B', 'C', LONER_FLOOR + 5); // …but B's best is C
    const r = chorusCues(cast, b);
    expect(r.pairs).toEqual([['B', 'C']]);
    expect(r.pairs.some(([x, y]) => x === 'A' || y === 'A')).toBe(false);
  });

  it('the loner comes in a beat after the rest have finished, several loners a beat apart', () => {
    let b: Bonds = {};
    b = bond(b, 'B', 'C', LONER_FLOOR + 2);
    b = bond(b, 'C', 'D', LONER_FLOOR);
    const r = chorusCues(cast, b);
    expect(r.late).toEqual(['A', 'E']); // energy order among the loners
    const restEnd = Math.max(...['B', 'C', 'D'].map((n) => atOf(r, n) + chirpParams(cast.find((c) => c.name === n)!.traits).lengthMs));
    expect(atOf(r, 'A')).toBe(restEnd + LATE_BEAT_MS);
    expect(atOf(r, 'E')).toBe(restEnd + 2 * LATE_BEAT_MS);
    // cues come back in playing order
    expect(r.cues.map((c) => c.who).slice(-2)).toEqual(['A', 'E']);
  });

  it('with nobody bonded, nobody is late', () => {
    const r = chorusCues(cast, bond({}, 'A', 'B', LONER_FLOOR - 1));
    expect(r.late).toEqual([]);
  });

  it('at the bond cap, the pair is the two who have met the most — not the first two in the alphabet', () => {
    let b: Bonds = {};
    for (const [x, y] of [['A', 'B'], ['A', 'C'], ['B', 'C'], ['C', 'D'], ['D', 'E'], ['B', 'D']]) b = bond(b, x, y, 100);
    const meetings = { [pairKey('C', 'D')]: 40, [pairKey('A', 'B')]: 30, [pairKey('A', 'C')]: 3, [pairKey('B', 'C')]: 5, [pairKey('B', 'D')]: 2, [pairKey('D', 'E')]: 1 };
    const r = chorusCues(cast, b, undefined, meetings);
    expect(r.pairs).toEqual([['A', 'B'], ['C', 'D']]);
  });

  it('closeness is read among the singers — a best friend on another ground does not block a pair here', () => {
    const b = bond(bond({}, 'A', 'Z', LONER_FLOOR + 10), 'A', 'B', LONER_FLOOR);
    const here = cast.slice(0, 2); // A and B sing; Z lives elsewhere
    const r = chorusCues(here, b, ['A', 'B', 'Z']);
    expect(r.pairs).toEqual([['A', 'B']]);
  });
});

describe('chorusLine', () => {
  it('names the ground alone when there is nothing to say', () => {
    expect(chorusLine('The Grove', [], [])).toBe('🎶 The Grove calls as you arrive');
  });
  it('names a pair', () => {
    expect(chorusLine('The Grove', [['Bramble', 'Pip']], [])).toBe('🎶 The Grove calls as you arrive — Bramble & Pip as one');
  });
  it('names the loner', () => {
    expect(chorusLine('Pocket Cretaceous', [], ['Twitch'])).toBe('🎶 Pocket Cretaceous calls as you arrive — Twitch a beat behind');
  });
  it('names both', () => {
    expect(chorusLine('Pocket Cretaceous', [['Rex', 'Sunny']], ['Twitch'])).toBe(
      '🎶 Pocket Cretaceous calls as you arrive — Rex & Sunny as one; Twitch a beat behind',
    );
  });
});

describe('arrivalDue', () => {
  it('a ground that never sang is due; one that just sang rests', () => {
    expect(arrivalDue(undefined, 500)).toBe(true);
    expect(arrivalDue(500, 500 + ARRIVAL_REST_MIN - 1)).toBe(false);
    expect(arrivalDue(500, 500 + ARRIVAL_REST_MIN)).toBe(true);
  });
});
