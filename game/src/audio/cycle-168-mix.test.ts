import { describe, it, expect } from 'vitest';
import { gainFor, VOICE_KINDS, type VoiceKind } from './mix';

// BACKLOG-559 — the mix. Two of these are identity cases (the numbers the park already made, so no
// voice anyone knows moved this cycle) and two are the feature: levels that were not expressible
// before because there was no object representing how loud the bowl is.

describe('gainFor — the identity cases', () => {
  it('a dino call is exactly as loud as it has been since cycle 44', () => {
    expect(gainFor('chirp')).toBe(0.12);
  });

  it('the glass rap keeps the old inline 1.4 factor, now written where it can be read', () => {
    expect(gainFor('thunk')).toBeCloseTo(0.12 * 1.4, 9);
  });
});

describe('gainFor — the two this cycle makes expressible', () => {
  it('the keeper sits back, a dino speaks at the bowl level, and a cry carries', () => {
    expect(gainFor('hail')).toBeLessThan(gainFor('chirp'));
    expect(gainFor('chirp')).toBeLessThan(gainFor('distress'));
  });
});

describe('gainFor — totality', () => {
  it('every kind has a finite level in (0, 1]', () => {
    for (const k of VOICE_KINDS) {
      const g = gainFor(k);
      expect(Number.isFinite(g)).toBe(true);
      expect(g).toBeGreaterThan(0);
      expect(g).toBeLessThanOrEqual(1);
    }
  });

  it('VOICE_KINDS lists each kind exactly once', () => {
    expect(new Set(VOICE_KINDS).size).toBe(VOICE_KINDS.length);
  });

  it('a kind added to the type but not to the table would be caught here', () => {
    // The table is private, so the check is the other way round: every listed kind resolves to a
    // number rather than to undefined. A new union member absent from VOICE_KINDS fails the compile
    // at its call site; one present but unlevelled fails here.
    const missing = VOICE_KINDS.filter((k: VoiceKind) => typeof gainFor(k) !== 'number');
    expect(missing).toEqual([]);
  });
});
