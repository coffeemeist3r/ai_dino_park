import { describe, it, expect } from 'vitest';
import { cannedReply, fondGreeting, FOND_MIN, wistfulGreeting } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';

/**
 * Fond greeting (BACKLOG-272). The warm pole of the wistful greeting (271): a close dino (≥ FOND_MIN
 * hearts, no gratitude) opens warmly. cannedReply order: gratitude → wistful (≤1) → fond (≥8) → generic.
 */

const FOND = 'There you are';
const WISTFUL = 'came to see';
const base = { name: 'Sunny', species: 'brontosaurus', personality: 'warm' };

describe('fondGreeting (BACKLOG-272)', () => {
  it('returns a warm line naming the dino', () => {
    expect(fondGreeting('Sunny')).toContain(FOND);
    expect(fondGreeting('Sunny')).toContain('Sunny');
  });
  it('FOND_MIN is the 8-heart close-friend cutoff', () => {
    expect(FOND_MIN).toBe(8);
  });
});

describe('cannedReply — the greeting reads the relationship (BACKLOG-272)', () => {
  it('a close dino (8 hearts, inclusive) greets fondly', () => {
    const r = cannedReply({ ...base, affection: FOND_MIN });
    expect(r.text).toBe(fondGreeting('Sunny'));
    expect(r.source).toBe('canned');
  });
  it('above the cutoff is still fond', () => {
    expect(cannedReply({ ...base, affection: 10 }).text).toContain(FOND);
  });
  it('the mid band (5 hearts) gets a generic line — not fond, not wistful', () => {
    const t = cannedReply({ ...base, affection: 5 }).text;
    expect(t).not.toContain(FOND);
    expect(t).not.toContain(WISTFUL);
  });
  it('the low pole (1 heart) still gets the wistful line (271 unchanged)', () => {
    expect(cannedReply({ ...base, affection: 1 }).text).toBe(wistfulGreeting('Sunny'));
  });
  it('no affection field → generic (back-compat)', () => {
    expect(cannedReply({ ...base }).text).not.toContain(FOND);
  });
  it('gratitude beats fond', () => {
    const r = cannedReply({ ...base, affection: 10, gratitude: 'Twitch' });
    expect(r.text).not.toContain(FOND);
    expect(r.text).toContain('Twitch');
  });
});

describe('buildMessages — fond colour for the LLM (BACKLOG-272)', () => {
  it('adds the fond clause for a close dino, and never alongside wistful', () => {
    const sys = buildMessages({ ...base, affection: 10 }, { kind: 'player_greet' })[0].content;
    expect(sys).toContain('dear, familiar friend');
    expect(sys).not.toContain('wistfully');
  });
  it('omits the fond clause for a mid-band dino', () => {
    expect(buildMessages({ ...base, affection: 5 }, { kind: 'player_greet' })[0].content).not.toContain('dear, familiar friend');
  });
  it('omits the fond clause when grateful', () => {
    expect(buildMessages({ ...base, affection: 10, gratitude: 'Twitch' }, { kind: 'player_greet' })[0].content).not.toContain('dear, familiar friend');
  });
});
