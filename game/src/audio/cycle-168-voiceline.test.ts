import { describe, it, expect } from 'vitest';
import { chirpParams, voiceLine, type ChirpParams, type VoiceParent } from './chirp';
import type { Personality } from '../ai/personality';

// BACKLOG-195 — the voice line. The blend itself is not new: `blendTraits` has been averaging a
// hatchling's traits per axis since cycle 42 and `chirpParams` has derived the call from traits since
// cycle 44, so a child's cry has always sat between its parents'. What is new is that you can read it.

const P = (pitchHz: number, notes = 2): ChirpParams => ({ pitchHz, lengthMs: 200, wobble: 0.3, notes });
const parent = (name: string, pitchHz: number): VoiceParent => ({ name, params: P(pitchHz) });

describe('voiceLine — the plain form', () => {
  it('names the pitch and the pip count', () => {
    expect(voiceLine(P(412))).toBe('🔊 voice · 412 Hz · 2 pips');
  });

  it('says "pip" for one', () => {
    expect(voiceLine(P(412, 1))).toBe('🔊 voice · 412 Hz · 1 pip');
  });

  it('a founder has no parents and gets the plain form', () => {
    const t: Personality = {
      sociability: 0.5, bravery: 0.5, energy: 0.5, curiosity: 0.5, agreeableness: 0.5,
    } as Personality;
    const line = voiceLine(chirpParams(t));
    expect(line.startsWith('🔊 voice · ')).toBe(true);
    expect(line).not.toContain('between');
  });
});

describe('voiceLine — the blend, made legible', () => {
  const rex = parent('Rex', 301);
  const sunny = parent('Sunny', 523);

  it('sits between its parents', () => {
    expect(voiceLine(P(412), [rex, sunny])).toBe(
      '🔊 voice · 412 Hz · 2 pips — between Rex 301 and Sunny 523',
    );
  });

  it('says so when the jitter pushed it above both', () => {
    expect(voiceLine(P(600), [rex, sunny])).toContain('— above both Rex 301 and Sunny 523');
  });

  it('says so when the jitter pushed it below both', () => {
    expect(voiceLine(P(200), [rex, sunny])).toContain('— below both Rex 301 and Sunny 523');
  });

  it('a child landing exactly on a parent is still between them', () => {
    // The pair is inclusive: a voice that landed on its mother's pitch did not escape the two it
    // came from, and calling that "above both" would be a line that lies.
    expect(voiceLine(P(301), [rex, sunny])).toContain('— between ');
    expect(voiceLine(P(523), [rex, sunny])).toContain('— between ');
  });

  it('keeps the parents in lineage order and does not let the order change the relation', () => {
    const forward = voiceLine(P(412), [rex, sunny]);
    const swapped = voiceLine(P(412), [sunny, rex]);
    expect(forward).toContain('— between Rex 301 and Sunny 523');
    expect(swapped).toContain('— between Sunny 523 and Rex 301');
  });
});
