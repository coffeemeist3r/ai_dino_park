import { describe, it, expect } from 'vitest';
import {
  gratefulMemory,
  whoClearedMyName,
  CLEARED_NAME_SUFFIX,
} from '../../game/src/world/cold';
import { reliefWordLine } from '../../game/src/world/cold';
import { cannedReply, thanksLine } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';
import type { MemoryStore } from '../../game/src/ai/memory';

/**
 * Thanks in the voice (BACKLOG-247). A dino that carries a first-hand `<clearer> cleared my name`
 * memory (filed by clearedName, 243) reads it back so its next keeper greeting names the clearer:
 * a deterministic canned line, and the same fact woven into the LLM prompt. Pure layer only here.
 */

describe('whoClearedMyName (BACKLOG-247)', () => {
  it('returns the clearer named in a first-hand grateful memory', () => {
    const store: MemoryStore = { Mossback: [gratefulMemory('Twitch')] };
    expect(whoClearedMyName(store, 'Mossback')).toBe('Twitch');
  });

  it('returns null when the dino holds no cleared-name memory', () => {
    const store: MemoryStore = { Mossback: ['shivered through a cold night, slept alone 🥶'] };
    expect(whoClearedMyName(store, 'Mossback')).toBeNull();
    expect(whoClearedMyName({}, 'Nobody')).toBeNull();
  });

  it('round-trips the exact string gratefulMemory produces', () => {
    const mem = gratefulMemory('Sunny');
    expect(mem.endsWith(CLEARED_NAME_SUFFIX)).toBe(true);
    expect(whoClearedMyName({ Glade: [mem] }, 'Glade')).toBe('Sunny');
  });

  it('ignores rumor-marked hearsay — only a first-hand grateful memory counts', () => {
    // A relief *rumor* a downstream dino heard mentions a name but is not a first-hand clearing.
    const store: MemoryStore = { Rex: [reliefWordLine('Twitch', 'saw Mossback came through it fine')] };
    expect(whoClearedMyName(store, 'Rex')).toBeNull();
  });

  it('returns the most-recent clearer when two are present', () => {
    const store: MemoryStore = { Mossback: [gratefulMemory('Twitch'), gratefulMemory('Sunny')] };
    expect(whoClearedMyName(store, 'Mossback')).toBe('Sunny');
  });
});

describe('thanks line — deterministic canned path (BACKLOG-247)', () => {
  it('cannedReply names the clearer when gratitude is set', () => {
    const reply = cannedReply({ name: 'Mossback', species: 'stegosaurus', personality: 'gruff', gratitude: 'Twitch' });
    expect(reply.text).toContain('Twitch');
    expect(reply.text).toBe(thanksLine('Twitch'));
    expect(reply.source).toBe('canned');
  });

  it('cannedReply with no gratitude returns a normal greeting (no clearer leaks in)', () => {
    const reply = cannedReply({ name: 'Mossback', species: 'stegosaurus', personality: 'gruff' });
    expect(reply.text).not.toContain('cleared');
    expect(reply.text).not.toContain('I owe them one');
    expect(reply.text.length).toBeGreaterThan(0);
  });
});

describe('thanks colour — LLM prompt weave (BACKLOG-247)', () => {
  const base = { name: 'Mossback', species: 'stegosaurus', personality: 'gruff' };

  it('buildMessages folds the clearer into the system prompt when gratitude is set', () => {
    const sys = buildMessages({ ...base, gratitude: 'Twitch' }, { kind: 'player_greet' })[0].content;
    expect(sys).toContain('Twitch');
    expect(sys).toContain('cleared your name');
  });

  it('buildMessages is unchanged (no clearer) when gratitude is unset', () => {
    const sys = buildMessages(base, { kind: 'player_greet' })[0].content;
    expect(sys).not.toContain('cleared your name');
  });
});
