import { describe, it, expect } from 'vitest';
import { cannedReply, wistfulGreeting, WISTFUL_MAX } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';

/**
 * Wistful greeting (BACKLOG-271). A neglected dino (player-friendship ≤ WISTFUL_MAX hearts, nothing to
 * be grateful for) opens wistfully instead of with the generic hello — the affection-pole counterpart
 * of the gratitude register. Pure layer only.
 */

const WISTFUL = 'came to see';
const base = { name: 'Rex', species: 'triceratops', personality: 'grumpy' };

describe('wistfulGreeting (BACKLOG-271)', () => {
  it('returns a wistful line naming the dino', () => {
    const line = wistfulGreeting('Rex');
    expect(line).toContain(WISTFUL);
    expect(line).toContain('Rex');
  });

  it('WISTFUL_MAX is the 1-heart neglected cutoff', () => {
    expect(WISTFUL_MAX).toBe(1);
  });
});

describe('cannedReply — wistful through the canned path (BACKLOG-271)', () => {
  it('a neglected dino (0 hearts, no gratitude) greets wistfully', () => {
    const reply = cannedReply({ ...base, affection: 0 });
    expect(reply.text).toBe(wistfulGreeting('Rex'));
    expect(reply.source).toBe('canned');
  });

  it('the cutoff is inclusive — exactly WISTFUL_MAX hearts is still wistful', () => {
    expect(cannedReply({ ...base, affection: WISTFUL_MAX }).text).toContain(WISTFUL);
  });

  it('a befriended dino (above the cutoff) gets a generic greeting, not the wistful line', () => {
    const reply = cannedReply({ ...base, affection: 2 });
    expect(reply.text).not.toContain(WISTFUL);
    expect(reply.source).toBe('canned');
  });

  it('a dino with no affection field gets a generic greeting (back-compat)', () => {
    expect(cannedReply({ ...base }).text).not.toContain(WISTFUL);
  });

  it('gratitude beats wistful: a cleared-name dino at 0 hearts thanks, not wistful', () => {
    const reply = cannedReply({ ...base, affection: 0, gratitude: 'Sunny' });
    expect(reply.text).not.toContain(WISTFUL);
    expect(reply.text).toContain('Sunny');
  });
});

describe('buildMessages — wistful colour for the LLM (BACKLOG-271)', () => {
  it('adds the wistful instruction for a neglected dino', () => {
    const sys = buildMessages({ ...base, affection: 0 }, { kind: 'player_greet' })[0].content;
    expect(sys).toContain('wistfully');
  });

  it('omits the wistful instruction for a befriended dino', () => {
    const sys = buildMessages({ ...base, affection: 6 }, { kind: 'player_greet' })[0].content;
    expect(sys).not.toContain('wistfully');
  });

  it('omits the wistful instruction when there is gratitude to give (gratitude wins)', () => {
    const sys = buildMessages({ ...base, affection: 0, gratitude: 'Sunny' }, { kind: 'player_greet' })[0].content;
    expect(sys).not.toContain('wistfully');
    expect(sys).toContain('cleared your name');
  });
});
