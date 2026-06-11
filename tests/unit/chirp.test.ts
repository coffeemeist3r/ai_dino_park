import { describe, it, expect } from 'vitest';
import { chirpParams, THUNK, SOUND_KEY } from '../../game/src/audio/chirp';
import { seededPersonality, type Personality } from '../../game/src/ai/personality';

const corners: Personality[] = [
  { curiosity: 0, sociability: 0, energy: 0, agreeableness: 0, bravery: 0 },
  { curiosity: 1, sociability: 1, energy: 1, agreeableness: 1, bravery: 1 },
  { curiosity: 1, sociability: 0, energy: 1, agreeableness: 0, bravery: 1 },
  { curiosity: 0, sociability: 1, energy: 0, agreeableness: 1, bravery: 0 },
];

describe('chirpParams', () => {
  it('is deterministic: identical traits give identical params', () => {
    const t = seededPersonality('Rex');
    expect(chirpParams(t)).toEqual(chirpParams({ ...t }));
  });

  it('stays bounded at every trait corner', () => {
    for (const t of corners) {
      const p = chirpParams(t);
      expect(p.pitchHz).toBeGreaterThanOrEqual(120);
      expect(p.pitchHz).toBeLessThanOrEqual(900);
      expect(p.lengthMs).toBeGreaterThanOrEqual(80);
      expect(p.lengthMs).toBeLessThanOrEqual(350);
      expect(p.wobble).toBeGreaterThanOrEqual(0);
      expect(p.wobble).toBeLessThanOrEqual(1);
      expect(p.notes).toBeGreaterThanOrEqual(1);
      expect(p.notes).toBeLessThanOrEqual(3);
    }
  });

  it('the voice is a personality tell: solitary+timid pitches high, social+brave low', () => {
    const skittish = chirpParams({ curiosity: 0.5, sociability: 0, energy: 0.5, agreeableness: 0.5, bravery: 0 });
    const tank = chirpParams({ curiosity: 0.5, sociability: 1, energy: 0.5, agreeableness: 0.5, bravery: 1 });
    expect(skittish.pitchHz).toBeGreaterThan(tank.pitchHz + 300);
  });

  it('the five founders spread into distinct voices (Twitch squeaks ≥100Hz above Sunny)', () => {
    const founders = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];
    const pitches = new Map(founders.map((n) => [n, chirpParams(seededPersonality(n)).pitchHz]));
    expect(pitches.get('Twitch')! - pitches.get('Sunny')!).toBeGreaterThanOrEqual(100);
    expect(new Set(pitches.values()).size).toBeGreaterThanOrEqual(4);
  });

  it('energetic dinos clip their calls short', () => {
    const calm = chirpParams({ curiosity: 0.5, sociability: 0.5, energy: 0, agreeableness: 0.5, bravery: 0.5 });
    const wired = chirpParams({ curiosity: 0.5, sociability: 0.5, energy: 1, agreeableness: 0.5, bravery: 0.5 });
    expect(calm.lengthMs).toBeGreaterThan(wired.lengthMs);
  });

  it('the thunk is the bowl, not a dino: lower and shorter than any voice', () => {
    expect(THUNK.pitchHz).toBeLessThan(120);
    expect(THUNK.lengthMs).toBeLessThanOrEqual(150);
    expect(THUNK.notes).toBe(1);
  });

  it('the storage key is a stable contract', () => {
    expect(SOUND_KEY).toBe('dino.sound');
  });
});
