import { describe, it, expect } from 'vitest';
import { TONES, toneById, toneScore, toneReaction, toneLabel, lastToneLine } from '../../game/src/social/tones';
import type { Personality } from '../../game/src/ai/personality';

// A few archetypes to prove the same tone lands differently per dino.
const warmSocial: Personality = { curiosity: 0.5, sociability: 0.95, energy: 0.5, agreeableness: 0.95, bravery: 0.5 };
const boldPrickly: Personality = { curiosity: 0.5, sociability: 0.3, energy: 0.85, agreeableness: 0.1, bravery: 0.95 };
const timidCalm: Personality = { curiosity: 0.2, sociability: 0.3, energy: 0.15, agreeableness: 0.6, bravery: 0.1 };

const warm = toneById('warm');
const tease = toneById('tease');
const honest = toneById('honest');

describe('tones', () => {
  it('has three tones, each appealing only to real personality axes', () => {
    expect(TONES.map((t) => t.id)).toEqual(['warm', 'tease', 'honest']);
    const axes = new Set(['curiosity', 'sociability', 'energy', 'agreeableness', 'bravery']);
    for (const t of TONES) {
      for (const k of Object.keys(t.appeal)) expect(axes.has(k)).toBe(true);
    }
  });

  it('toneById round-trips every id, toneLabel reads its label', () => {
    for (const t of TONES) {
      expect(toneById(t.id).id).toBe(t.id);
      expect(toneLabel(t.id)).toBe(t.label);
    }
  });

  it('toneScore is 0 with no traits', () => {
    expect(toneScore(warm, undefined)).toBe(0);
    expect(toneScore(tease, undefined)).toBe(0);
  });

  it('toneScore sign tracks the appeal fit', () => {
    expect(toneScore(warm, warmSocial)).toBeGreaterThan(0);
    expect(toneScore(tease, boldPrickly)).toBeGreaterThan(0);
    expect(toneScore(tease, timidCalm)).toBeLessThan(0);
  });

  // Criterion 3: personality-fit — same tone, opposite verdicts across dinos.
  it('a warm, social dino welcomes Warm; a bold, prickly dino welcomes Tease', () => {
    const warmReact = toneReaction(warm, warmSocial);
    expect(warmReact.delta).toBeGreaterThan(0);
    expect(['loved', 'liked']).toContain(warmReact.verdict);

    const teaseReact = toneReaction(tease, boldPrickly);
    expect(teaseReact.delta).toBeGreaterThan(0);
    expect(['loved', 'liked']).toContain(teaseReact.verdict);
  });

  it('a timid, calm dino clashes with Tease (negative delta)', () => {
    const react = toneReaction(tease, timidCalm);
    expect(react.verdict).toBe('clashed');
    expect(react.delta).toBeLessThan(0);
  });

  it('a curious dino appreciates Honest', () => {
    const curious: Personality = { curiosity: 0.95, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.7 };
    const react = toneReaction(honest, curious);
    expect(react.delta).toBeGreaterThan(0);
  });

  it('no traits → a neutral, tiny positive nudge', () => {
    const react = toneReaction(warm, undefined);
    expect(react.verdict).toBe('neutral');
    expect(react.delta).toBe(1);
  });

  it('lastToneLine is empty for an unknown last tone, descriptive otherwise', () => {
    expect(lastToneLine(undefined)).toBe('');
    expect(lastToneLine('warm')).toContain('warm');
    expect(lastToneLine('tease')).toContain('teasing');
    expect(lastToneLine('honest')).toContain('honest');
  });
});
