import { describe, it, expect } from 'vitest';
import {
  KEEPER_HAIL,
  ANSWER_SLOW_MS,
  ANSWER_FAST_MS,
  EAGER_PIP_HEARTS,
  answerDelayMs,
  answerParams,
} from '../../game/src/audio/answer';
import { chirpParams, THUNK } from '../../game/src/audio/chirp';
import { ROSTER } from '../../game/src/entities/roster';
import { seededPersonality } from '../../game/src/ai/personality';
import { HEARTS_MAX } from '../../game/src/social/friendship';

// BACKLOG-193 — call and answer. Every criterion here is driven off the real roster's traits rather
// than invented personality vectors, because the claim that matters (L4) is about the *cast*: the
// voicebox is only worth decorating if you can still tell Twitch from Mossback afterwards.

const HEARTS = Array.from({ length: HEARTS_MAX + 1 }, (_, i) => i);

/** Traits are name-seeded (ai/personality.ts), so the cast is derived exactly as the scene derives it. */
const CAST = ROSTER.map((d) => ({ name: d.name, traits: seededPersonality(d.name) }));

describe('L1 — the pause shrinks as the dino warms to you', () => {
  it('runs from slow at zero hearts to fast at ten', () => {
    expect(answerDelayMs(0)).toBe(ANSWER_SLOW_MS);
    expect(answerDelayMs(HEARTS_MAX)).toBe(ANSWER_FAST_MS);
    expect(ANSWER_SLOW_MS).toBe(780);
    expect(ANSWER_FAST_MS).toBe(90);
  });

  it('is monotone non-increasing across every heart', () => {
    const delays = HEARTS.map(answerDelayMs);
    for (let i = 1; i < delays.length; i++) expect(delays[i]).toBeLessThanOrEqual(delays[i - 1]);
    // and it genuinely moves — a "monotone" constant would pass the loop above
    expect(delays[0]).toBeGreaterThan(delays[delays.length - 1]);
  });

  it('clamps outside the heart range rather than extrapolating', () => {
    expect(answerDelayMs(-5)).toBe(ANSWER_SLOW_MS);
    expect(answerDelayMs(999)).toBe(ANSWER_FAST_MS);
  });
});

describe('L3 — a stranger sounds exactly as it always has', () => {
  it('is byte-identical to chirpParams at zero hearts, for every dino', () => {
    for (const d of CAST) expect(answerParams(d.traits, 0)).toEqual(chirpParams(d.traits));
  });
});

describe('L2 — eagerness', () => {
  it('a fond dino answers shorter, bendier and with no fewer pips', () => {
    for (const d of CAST) {
      const cold = answerParams(d.traits, 0);
      const fond = answerParams(d.traits, HEARTS_MAX);
      expect(fond.lengthMs).toBeLessThan(cold.lengthMs);
      expect(fond.wobble).toBeGreaterThanOrEqual(cold.wobble);
      expect(fond.notes).toBeGreaterThanOrEqual(cold.notes);
    }
  });

  it('the extra pip arrives at the eager threshold and not before', () => {
    for (const d of CAST) {
      const base = chirpParams(d.traits).notes;
      expect(answerParams(d.traits, EAGER_PIP_HEARTS - 1).notes).toBe(base);
      expect(answerParams(d.traits, EAGER_PIP_HEARTS).notes).toBe(base + 1);
    }
  });
});

describe('L4 — the cast stays identifiable', () => {
  it('no dino drifts more than a tenth of its own pitch, however fond', () => {
    for (const d of CAST) {
      const base = chirpParams(d.traits).pitchHz;
      for (const h of HEARTS) {
        const drift = Math.abs(answerParams(d.traits, h).pitchHz - base) / base;
        expect(drift).toBeLessThan(0.1);
      }
    }
  });

  it('a bowl where every dino is adored sorts by pitch in exactly the order a bowl of strangers does', () => {
    const order = (h: number) =>
      [...CAST]
        .sort((a, b) => answerParams(a.traits, h).pitchHz - answerParams(b.traits, h).pitchHz)
        .map((d) => d.name);
    expect(order(HEARTS_MAX)).toEqual(order(0));
  });
});

describe('L5 — the keeper is not a creature', () => {
  it('hails above every pitch chirpParams can ever produce, not merely above today s cast', () => {
    // chirpParams is `120 + 780 * clamp01(height)`, so 900 is its hard ceiling for any trait vector
    // that will ever exist — including dinos not yet hatched.
    expect(KEEPER_HAIL.pitchHz).toBeGreaterThan(900);
    for (const d of CAST) expect(KEEPER_HAIL.pitchHz).not.toBe(chirpParams(d.traits).pitchHz);
  });

  it('is not the glass rap either, and is plain', () => {
    expect(KEEPER_HAIL.pitchHz).not.toBe(THUNK.pitchHz);
    expect(KEEPER_HAIL.wobble).toBe(0);
    expect(KEEPER_HAIL.notes).toBe(2);
  });
});
