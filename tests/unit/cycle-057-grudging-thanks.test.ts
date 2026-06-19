import { describe, it, expect } from 'vitest';
import { cannedReply, thanksLine, PRICKLY_MAX } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Grudging thanks (BACKLOG-253). The cleared-name thanks (247) now reads the dino's `agreeableness`
 * axis: a prickly dino (< PRICKLY_MAX) grumbles its thanks, a warm/even one says it plain. Pure
 * layer only — synthetic traits keep this independent of roster seeding.
 */

const prickly: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.1, bravery: 0.5 };
const warm: Personality = { curiosity: 0.5, sociability: 0.5, energy: 0.5, agreeableness: 0.9, bravery: 0.5 };
const GRUFF = 'thanks, I guess';
const WARM = 'I owe them one';

describe('thanksLine — temperament colours the thanks (BACKLOG-253)', () => {
  it('returns the gruff variant for a prickly dino, naming the clearer', () => {
    const line = thanksLine('Twitch', prickly);
    expect(line).toContain(GRUFF);
    expect(line).toContain('Twitch');
    expect(line).not.toContain(WARM);
  });

  it('returns the existing warm line for a warm dino', () => {
    expect(thanksLine('Twitch', warm)).toBe(thanksLine('Twitch'));
    expect(thanksLine('Twitch', warm)).toContain(WARM);
  });

  it('defaults to the warm line with no traits (back-compat)', () => {
    expect(thanksLine('Twitch')).toContain(WARM);
    expect(thanksLine('Twitch')).not.toContain(GRUFF);
  });

  it('the prickly cutoff is exclusive — exactly PRICKLY_MAX is not prickly', () => {
    const edge: Personality = { ...warm, agreeableness: PRICKLY_MAX };
    expect(thanksLine('Twitch', edge)).toContain(WARM);
  });
});

describe('cannedReply — grudging thanks through the canned path (BACKLOG-253)', () => {
  it('a prickly grateful dino gives the gruff thanks', () => {
    const reply = cannedReply({ name: 'Rex', species: 'triceratops', personality: 'gruff', traits: prickly, gratitude: 'Twitch' });
    expect(reply.text).toBe(thanksLine('Twitch', prickly));
    expect(reply.text).toContain(GRUFF);
    expect(reply.source).toBe('canned');
  });

  it('a warm grateful dino keeps the warm thanks', () => {
    const reply = cannedReply({ name: 'Sunny', species: 'parasaurolophus', personality: 'warm', traits: warm, gratitude: 'Twitch' });
    expect(reply.text).toBe(thanksLine('Twitch'));
    expect(reply.text).toContain(WARM);
  });
});

describe('buildMessages — grudging colour for the LLM (BACKLOG-253)', () => {
  const base = { name: 'Rex', species: 'triceratops', personality: 'gruff' };

  it('adds the grudging instruction for a prickly grateful dino, keeping the clearer fact', () => {
    const sys = buildMessages({ ...base, traits: prickly, gratitude: 'Twitch' }, { kind: 'player_greet' })[0].content;
    expect(sys).toContain('grudgingly');
    expect(sys).toContain('cleared your name');
    expect(sys).toContain('Twitch');
  });

  it('omits the grudging instruction for a warm grateful dino', () => {
    const sys = buildMessages({ ...base, traits: warm, gratitude: 'Twitch' }, { kind: 'player_greet' })[0].content;
    expect(sys).not.toContain('grudgingly');
    expect(sys).toContain('cleared your name');
  });
});
