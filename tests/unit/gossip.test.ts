import { describe, it, expect } from 'vitest';
import {
  swapPronouns,
  isShareable,
  pickGossip,
  makeRumor,
  spreadGossip,
  RUMOR_MARK,
} from '../../game/src/social/gossip';
import { recall, type MemoryStore } from '../../game/src/ai/memory';

describe('swapPronouns', () => {
  it('rewrites first person to third person', () => {
    expect(swapPronouns('the human gave you a shell, and you loved it')).toBe(
      'the human gave they a shell, and they loved it',
    );
    expect(swapPronouns('your friend Rex')).toBe('their friend Rex');
    expect(swapPronouns("you're back")).toBe('they are back');
  });
});

describe('isShareable / pickGossip', () => {
  it('treats heard rumors as non-shareable', () => {
    expect(isShareable('the human stopped by to say hello')).toBe(true);
    expect(isShareable(`Rex ${RUMOR_MARK} the human stopped by`)).toBe(false);
  });

  it('picks the most recent first-hand event, skipping rumors', () => {
    const events = ['the human stopped by', `Sunny ${RUMOR_MARK} they napped`, 'you found a rock'];
    expect(pickGossip(events)).toBe('you found a rock');
  });

  it('returns null when there is nothing first-hand to share', () => {
    expect(pickGossip([])).toBeNull();
    expect(pickGossip([`Sunny ${RUMOR_MARK} they napped`])).toBeNull();
  });
});

describe('makeRumor', () => {
  it('attributes the rumor to the speaker and swaps pronouns', () => {
    expect(makeRumor('Rex', 'the human gave you a shell')).toBe(`Rex ${RUMOR_MARK} the human gave they a shell`);
  });
});

describe('spreadGossip', () => {
  it('plants a non-re-shareable rumor in the listener', () => {
    const store: MemoryStore = { Rex: ['the human gave you a shell'] };
    const { store: next, rumor } = spreadGossip(store, 'Rex', 'Sunny');
    expect(rumor).toContain(RUMOR_MARK);
    expect(recall(next, 'Sunny')).toContain(rumor);
    // the planted rumor cannot itself be gossiped onward (1 hop)
    expect(isShareable(recall(next, 'Sunny')[0])).toBe(false);
    // speaker's own memory is untouched
    expect(recall(next, 'Rex')).toEqual(['the human gave you a shell']);
  });

  it('no-ops on self-gossip or an empty speaker', () => {
    const store: MemoryStore = { Rex: ['the human stopped by'] };
    expect(spreadGossip(store, 'Rex', 'Rex')).toEqual({ store, rumor: null });
    expect(spreadGossip(store, 'Glade', 'Sunny')).toEqual({ store, rumor: null });
  });
});
