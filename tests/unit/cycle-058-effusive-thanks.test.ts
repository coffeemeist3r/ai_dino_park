import { describe, it, expect } from 'vitest';
import { cannedReply, thanksLine, PRICKLY_MAX, EFFUSIVE_MIN } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Effusive thanks (BACKLOG-261). The warm twin of grudging thanks (253): the cleared-name thanks (247)
 * now also gushes when the dino is warm (`agreeableness > EFFUSIVE_MIN`). With both poles voiced the
 * manner is a three-way read — gruff / plain / effusive. Pure layer only; synthetic traits keep this
 * independent of roster seeding.
 */

const prickly: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.1, bravery: 0.5 };
const even: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.5, bravery: 0.5 };
const warm: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.9, bravery: 0.5 };
const GUSH = 'never forget';
const PLAIN = 'I owe them one';
const GRUFF = 'thanks, I guess';

describe('thanksLine — warmth gushes (BACKLOG-261)', () => {
  it('returns a gushing line for a warm dino, distinct from the plain and gruff lines, still naming the clearer', () => {
    const line = thanksLine('Twitch', warm);
    expect(line).toContain(GUSH);
    expect(line).toContain('Twitch');
    expect(line).not.toContain(PLAIN);
    expect(line).not.toContain(GRUFF);
  });

  it('keeps the plain line for an even-tempered dino (middle band unchanged)', () => {
    expect(thanksLine('Twitch', even)).toBe(thanksLine('Twitch'));
    expect(thanksLine('Twitch', even)).toContain(PLAIN);
    expect(thanksLine('Twitch', even)).not.toContain(GUSH);
  });

  it('keeps the gruff line for a prickly dino (253 cross-check — branches do not bleed)', () => {
    expect(thanksLine('Twitch', prickly)).toContain(GRUFF);
    expect(thanksLine('Twitch', prickly)).not.toContain(GUSH);
  });

  it('defaults to the plain line with no traits (back-compat)', () => {
    expect(thanksLine('Twitch')).toContain(PLAIN);
    expect(thanksLine('Twitch')).not.toContain(GUSH);
  });

  it('EFFUSIVE_MIN is the 0.6 high-pole cutoff and sits above PRICKLY_MAX', () => {
    expect(EFFUSIVE_MIN).toBe(0.6);
    expect(EFFUSIVE_MIN).toBeGreaterThan(PRICKLY_MAX);
  });

  it('the effusive cutoff is exclusive — exactly EFFUSIVE_MIN is not effusive (plain band)', () => {
    const edge: Personality = { ...warm, agreeableness: EFFUSIVE_MIN };
    expect(thanksLine('Twitch', edge)).toContain(PLAIN);
    expect(thanksLine('Twitch', edge)).not.toContain(GUSH);
  });
});

describe('cannedReply — effusive thanks through the canned path (BACKLOG-261)', () => {
  it('a warm grateful dino gushes', () => {
    const reply = cannedReply({ name: 'Twitch', species: 'compsognathus', personality: 'sunny', traits: warm, gratitude: 'Sunny' });
    expect(reply.text).toBe(thanksLine('Sunny', warm));
    expect(reply.text).toContain(GUSH);
    expect(reply.source).toBe('canned');
  });
});

describe('buildMessages — effusive colour for the LLM (BACKLOG-261)', () => {
  const base = { name: 'Twitch', species: 'compsognathus', personality: 'sunny' };

  it('adds the effusive instruction (not the grudging one) for a warm grateful dino, keeping the fact', () => {
    const sys = buildMessages({ ...base, traits: warm, gratitude: 'Sunny' }, { kind: 'player_greet' })[0].content;
    expect(sys).toContain('effusive');
    expect(sys).not.toContain('grudgingly');
    expect(sys).toContain('cleared your name');
    expect(sys).toContain('Sunny');
  });

  it('still adds the grudging instruction (not the effusive one) for a prickly grateful dino', () => {
    const sys = buildMessages({ ...base, traits: prickly, gratitude: 'Sunny' }, { kind: 'player_greet' })[0].content;
    expect(sys).toContain('grudgingly');
    expect(sys).not.toContain('effusive');
  });

  it('adds neither manner clause for an even-tempered grateful dino', () => {
    const sys = buildMessages({ ...base, traits: even, gratitude: 'Sunny' }, { kind: 'player_greet' })[0].content;
    expect(sys).not.toContain('grudgingly');
    expect(sys).not.toContain('effusive');
    expect(sys).toContain('cleared your name');
  });
});
