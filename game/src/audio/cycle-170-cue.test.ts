import { describe, it, expect } from 'vitest';
import { answerCues, byTime, callbackCues, dueCue, type Cue } from './cue';
import { answerDelayMs, answerParams, KEEPER_HAIL } from './answer';
import { chirpParams, pipStrideMs } from './chirp';
import { callbackDelayMs } from '../world/distress';
import { seededPersonality } from '../ai/personality';

/**
 * BACKLOG-562 — the voice has a clock. The builders are pinned against the numbers 193 and 202 already
 * shipped with, so moving those beats onto cues is byte-identical by construction; and the roster guard
 * is pinned once, because the scene's player routes through `dueCue`.
 */

const rex = seededPersonality('Rex');
const ascending = (cs: Cue[]) => cs.every((c, i) => i === 0 || cs[i - 1].atMs <= c.atMs);

describe('pipStrideMs', () => {
  it('is a pip plus a hair of air', () => {
    expect(pipStrideMs({ pitchHz: 400, lengthMs: 300, wobble: 0, notes: 3 })).toBeCloseTo(115);
    expect(pipStrideMs({ pitchHz: 400, lengthMs: 100, wobble: 0, notes: 1 })).toBeCloseTo(115);
  });
});

describe('answerCues (193 as the identity case)', () => {
  for (const hearts of [0, 5, 10]) {
    it(`hail at 0, the warmed answer at answerDelayMs(${hearts})`, () => {
      const cs = answerCues('Rex', rex, hearts);
      expect(cs).toHaveLength(2);
      expect(cs[0]).toEqual({ atMs: 0, params: KEEPER_HAIL, kind: 'hail' });
      expect(cs[0].who).toBeUndefined();
      expect(cs[1]).toEqual({ atMs: answerDelayMs(hearts), who: 'Rex', params: answerParams(rex, hearts), kind: 'chirp' });
      expect(ascending(cs)).toBe(true);
    });
  }
});

describe('callbackCues (202)', () => {
  it('one cue, the friend in its ordinary voice, at callbackDelayMs', () => {
    expect(callbackCues('Rex', rex, 30)).toEqual([
      { atMs: callbackDelayMs(30), who: 'Rex', params: chirpParams(rex), kind: 'chirp' },
    ]);
  });
});

describe('byTime', () => {
  it('sorts ascending and keeps ties in given order', () => {
    const p = chirpParams(rex);
    const out = byTime([
      { atMs: 50, who: 'a', params: p, kind: 'chirp' },
      { atMs: 0, who: 'b', params: p, kind: 'chirp' },
      { atMs: 50, who: 'c', params: p, kind: 'chirp' },
    ]);
    expect(out.map((c) => c.who)).toEqual(['b', 'a', 'c']);
  });
});

describe('dueCue — the roster guard, once', () => {
  const p = chirpParams(rex);
  const roster = new Map([['Rex', { name: 'Rex' }]]);
  const resolve = (n: string) => roster.get(n);

  it('the keeper always fires', () => {
    expect(dueCue({ atMs: 0, params: KEEPER_HAIL, kind: 'hail' }, resolve)).toEqual({ dino: null });
  });
  it('a dino still here fires as itself', () => {
    expect(dueCue({ atMs: 90, who: 'Rex', params: p, kind: 'chirp' }, resolve)).toEqual({ dino: { name: 'Rex' } });
  });
  it('a dino that left the roster during the gap is silent', () => {
    expect(dueCue({ atMs: 90, who: 'Gone', params: p, kind: 'chirp' }, resolve)).toBeNull();
  });
});
