import { describe, it, expect } from 'vitest';
import { policyWordLine, spreadPolicyWord } from '../../game/src/world/policyword';
import { isShareable } from '../../game/src/social/gossip';
import { recall, type MemoryStore } from '../../game/src/ai/memory';

/**
 * Word of how the ground decides (BACKLOG-470) — Milestone 9's second lore arc. 469 let a hungry dino say
 * what its ground's policy meant to *it*; this lets the policy itself travel the bowl on the gossip spine,
 * the way word of the provider (453) already does. Sibling coverage to cycle-108-provider-word.
 */

describe('policyWordLine (BACKLOG-470)', () => {
  it('reads differently for each stance', () => {
    expect(policyWordLine('Rex', 'The Grove', 'feed')).toContain('The Grove feeds its own first');
    expect(policyWordLine('Rex', 'The Grove', 'bank')).toContain('The Grove banks against the winter');
  });

  it('carries the rumor mark, so it reads as heard and not witnessed', () => {
    expect(isShareable(policyWordLine('Rex', 'The Grove', 'feed'))).toBe(false);
    expect(isShareable(policyWordLine('Rex', 'The Grove', 'bank'))).toBe(false);
  });

  it('names the zone without doubling its article', () => {
    expect(policyWordLine('Rex', 'The Grove', 'feed')).not.toContain('the The');
    expect(policyWordLine('Rex', 'The Fernreach', 'bank')).not.toContain('the The');
  });

  it('names the speaker so the listener knows who told it', () => {
    expect(policyWordLine('Rex', 'The Grove', 'feed').startsWith('Rex ')).toBe(true);
  });
});

describe('spreadPolicyWord (BACKLOG-470)', () => {
  const store: MemoryStore = {};

  it('plants the word on the listener and returns it', () => {
    const { store: after, rumor } = spreadPolicyWord(store, 'Rex', 'Mossback', 'feed', 'The Fernreach');
    expect(rumor).toBe(policyWordLine('Rex', 'The Fernreach', 'feed'));
    expect(recall(after, 'Mossback')).toContain(rumor);
    expect(recall(after, 'Rex')).not.toContain(rumor); // the speaker doesn't remember telling it
  });

  it('plants a rumor that cannot re-spread — one hop, like every other word', () => {
    const { rumor } = spreadPolicyWord(store, 'Rex', 'Mossback', 'bank', 'The Fernreach');
    expect(isShareable(rumor!)).toBe(false);
  });

  it('says nothing when the ground has no policy', () => {
    for (const p of [null, undefined] as const) {
      const out = spreadPolicyWord(store, 'Rex', 'Mossback', p, 'The Fernreach');
      expect(out.rumor).toBeNull();
      expect(out.store).toBe(store);
    }
  });

  it('says nothing to itself', () => {
    const out = spreadPolicyWord(store, 'Rex', 'Rex', 'feed', 'The Fernreach');
    expect(out.rumor).toBeNull();
    expect(out.store).toBe(store);
  });

  it('lets the provider speak of its own ground — a policy is a fact, not a compliment', () => {
    // The deliberate divergence from 453, which silences a provider talking up its own pantry.
    const { rumor } = spreadPolicyWord(store, 'Sunny', 'Mossback', 'bank', 'The Fernreach');
    expect(rumor).toBe(policyWordLine('Sunny', 'The Fernreach', 'bank'));
  });
});
