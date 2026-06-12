import { describe, it, expect } from 'vitest';
import { DISTRESS_STEPS, mostDistressed, hearLine, heardMemory } from '../../game/src/world/distress';
import { chirpParams, distressParams } from '../../game/src/audio/chirp';
import { seededPersonality, type Personality } from '../../game/src/ai/personality';

const FOUNDERS = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];

const corners: Personality[] = [
  { curiosity: 0, sociability: 0, energy: 0, agreeableness: 0, bravery: 0 },
  { curiosity: 1, sociability: 1, energy: 1, agreeableness: 1, bravery: 1 },
  { curiosity: 1, sociability: 0, energy: 1, agreeableness: 0, bravery: 1 },
  { curiosity: 0, sociability: 1, energy: 0, agreeableness: 1, bravery: 0 },
];

describe('mostDistressed', () => {
  it('the lowest level cries out', () => {
    const who = mostDistressed([
      { name: 'Rex', level: 0.7 },
      { name: 'Twitch', level: 0.1 },
      { name: 'Sunny', level: 0.4 },
    ]);
    expect(who).toBe('Twitch');
  });

  it('equal levels break to the lexicographic-smallest name', () => {
    const who = mostDistressed([
      { name: 'Twitch', level: 0 },
      { name: 'Glade', level: 0 },
      { name: 'Sunny', level: 0 },
    ]);
    expect(who).toBe('Glade');
  });

  it('nobody distressed, nobody cries', () => {
    expect(mostDistressed([])).toBeNull();
  });
});

describe('the responder beat', () => {
  it('hearLine and heardMemory carry the caller by name', () => {
    expect(hearLine('Twitch')).toContain('Twitch');
    expect(hearLine('Twitch')).toContain('👂');
    expect(heardMemory('Twitch')).toContain('Twitch');
    expect(heardMemory('Twitch')).toContain('cry');
  });

  it('the walk budget honors the design minimum', () => {
    expect(DISTRESS_STEPS).toBeGreaterThanOrEqual(4);
  });
});

describe('distressParams — the same voice, frightened', () => {
  it('is strictly higher, strictly shorter, and a two-pip yelp for every founder', () => {
    for (const name of FOUNDERS) {
      const t = seededPersonality(name);
      const base = chirpParams(t);
      const cry = distressParams(t);
      expect(cry.pitchHz).toBeGreaterThan(base.pitchHz);
      expect(cry.pitchHz).toBeLessThanOrEqual(1100);
      expect(cry.lengthMs).toBeLessThan(base.lengthMs);
      expect(cry.lengthMs).toBeGreaterThanOrEqual(60);
      expect(cry.notes).toBe(2);
      expect(cry.wobble).toBeLessThanOrEqual(1);
    }
  });

  it('stays clamped at every trait corner', () => {
    for (const t of corners) {
      const cry = distressParams(t);
      expect(cry.pitchHz).toBeGreaterThan(chirpParams(t).pitchHz);
      expect(cry.pitchHz).toBeLessThanOrEqual(1100);
      expect(cry.lengthMs).toBeGreaterThanOrEqual(60);
      expect(cry.lengthMs).toBeLessThan(chirpParams(t).lengthMs);
      expect(cry.wobble).toBeLessThanOrEqual(1);
    }
  });

  it('the founders keep their pitch order in distress — Twitch still shrieks above Mossback', () => {
    const baseOrder = [...FOUNDERS].sort(
      (a, b) => chirpParams(seededPersonality(a)).pitchHz - chirpParams(seededPersonality(b)).pitchHz,
    );
    const cryOrder = [...FOUNDERS].sort(
      (a, b) => distressParams(seededPersonality(a)).pitchHz - distressParams(seededPersonality(b)).pitchHz,
    );
    expect(cryOrder).toEqual(baseOrder);
    const twitch = distressParams(seededPersonality('Twitch')).pitchHz;
    const mossback = distressParams(seededPersonality('Mossback')).pitchHz;
    expect(twitch).toBeGreaterThan(mossback);
  });
});
