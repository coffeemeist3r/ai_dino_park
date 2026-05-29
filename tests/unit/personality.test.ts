import { describe, it, expect } from 'vitest';
import {
  seededPersonality,
  describePersonality,
  AXES,
  type Personality,
} from '../../game/src/ai/personality';
import { makeBrain } from '../../game/src/ai/brain';

describe('seededPersonality', () => {
  it('is deterministic and bounded', () => {
    const a = seededPersonality('Rex');
    const b = seededPersonality('Rex');
    expect(a).toEqual(b);
    for (const axis of AXES) {
      const v = a[axis.key];
      expect(Number.isFinite(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('differs between two names', () => {
    const rex = seededPersonality('Rex');
    const moss = seededPersonality('Mossback');
    const someAxisDiffers = AXES.some((axis) => rex[axis.key] !== moss[axis.key]);
    expect(someAxisDiffers).toBe(true);
  });
});

describe('describePersonality', () => {
  it('names the dominant poles', () => {
    const p: Personality = {
      curiosity: 0.9,
      sociability: 0.9,
      energy: 0.5,
      agreeableness: 0.5,
      bravery: 0.9,
    };
    const desc = describePersonality(p);
    expect(desc).toContain('curious');
    expect(desc).toContain('social');
    expect(desc).toContain('bold');
    expect(desc).not.toContain('cautious');
    expect(desc).not.toContain('solitary');
    expect(desc).not.toContain('timid');
  });

  it('falls back to even-tempered when nothing dominates', () => {
    const flat: Personality = {
      curiosity: 0.5,
      sociability: 0.5,
      energy: 0.5,
      agreeableness: 0.5,
      bravery: 0.5,
    };
    expect(describePersonality(flat)).toBe('even-tempered');
  });
});

describe('stub brain mood reflects traits', () => {
  const base: Personality = {
    curiosity: 0.5,
    sociability: 0.5,
    energy: 0.5,
    agreeableness: 0.5,
    bravery: 0.5,
  };

  it('a timid dino replies wary', async () => {
    const reply = await makeBrain('stub').respond(
      { name: 'Twitch', species: 'compy', personality: '', traits: { ...base, bravery: 0.1 } },
      { kind: 'player_greet' },
    );
    expect(reply.mood).toBe('wary');
  });

  it('a social, warm dino replies happy', async () => {
    const reply = await makeBrain('stub').respond(
      {
        name: 'Sunny',
        species: 'bronto',
        personality: '',
        traits: { ...base, sociability: 0.9, agreeableness: 0.8 },
      },
      { kind: 'player_greet' },
    );
    expect(reply.mood).toBe('happy');
  });
});
