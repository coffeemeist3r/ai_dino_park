import { describe, it, expect } from 'vitest';
import { fidget, moodFidget, type Mood } from '../../game/src/world/fidget';
import type { Personality } from '../../game/src/ai/personality';

// A few distinct personalities so the signature quirk varies across axes.
const pacer: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.95 };
const timid: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.05 };
const bouncer: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.95, agreeableness: 0.5, bravery: 0.5 };

describe('moodFidget — quirk shaded by feeling (BACKLOG-310)', () => {
  it('no mood is byte-identical to fidget()', () => {
    for (const p of [pacer, timid, bouncer]) {
      expect(moodFidget(p)).toEqual(fidget(p));
    }
  });

  it('a sulk swaps the glyph to 😒 and adds the clause', () => {
    const q = moodFidget(pacer, 'sulk');
    expect(q.glyph).toBe('😒');
    expect(q.label).toBe(`${fidget(pacer).label}, sulking`);
  });

  it('cold keeps the signature glyph but adds the shiver clause', () => {
    const base = fidget(pacer);
    const q = moodFidget(pacer, 'cold');
    expect(q.glyph).toBe(base.glyph); // 🥶 floats separately — no double glyph
    expect(q.label).toBe(`${base.label}, shivering`);
  });

  it('the shaded label always begins with the dino\'s signature motion', () => {
    for (const p of [pacer, timid, bouncer]) {
      for (const mood of ['sulk', 'cold'] as Mood[]) {
        expect(moodFidget(p, mood).label.startsWith(fidget(p).label)).toBe(true);
      }
    }
  });
});
