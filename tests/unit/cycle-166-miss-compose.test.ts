import { describe, it, expect } from 'vitest';
import { cannedReply, type NPCContext } from '../../game/src/ai/brain';
import { watcherAside } from '../../game/src/keeper/voice';
import { missAside } from '../../game/src/keeper/succession';
import type { Personality } from '../../game/src/ai/personality';

/**
 * BACKLOG-162 — the miss composes onto every register, costs nothing when absent, and **outranks** the
 * first look when both apply.
 *
 * The second half is BACKLOG-160's guard, re-run for this cycle's insertion. `cannedReply` appends its
 * asides through a chain of `.slice()` caps, and a step inserted without extending `headroom` truncates
 * long replies with nothing in the suite going red — the reply just gets shorter. `headroom` is now
 * `firstLook.length + miss.length`, and exactly one of the two is ever appended, so a context with
 * neither keeps the chain's exact numbers.
 */

const traits: Personality = {
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness: 0.5,
  bravery: 0.5,
};

const base = (extra: Partial<NPCContext> = {}): NPCContext => ({
  name: 'Rex',
  species: 'raptor',
  personality: 'even-tempered',
  traits,
  ...extra,
});

describe('the miss composes onto every register', () => {
  const note = missAside('aether', traits);

  it('lands on the stranger hello — day one, no friendship, which is where the item has to be reachable', () => {
    expect(cannedReply(base({ affection: 0, missed: 'aether' })).text).toContain(note.trim());
  });

  it('lands on the fond hello too', () => {
    expect(cannedReply(base({ affection: 9, missed: 'aether' })).text).toContain(note.trim());
  });

  it('differs by which watcher left — not a generic "something changed"', () => {
    const lostAki = cannedReply(base({ affection: 9, missed: 'aether' })).text;
    const lostKes = cannedReply(base({ affection: 9, missed: 'kestrel' })).text;
    expect(lostAki).not.toBe(lostKes);
  });

  it('comes before the hunger tell, as the first look does', () => {
    const text = cannedReply(base({ affection: 9, missed: 'aether', hungry: true })).text;
    expect(text.indexOf(note.trim())).toBeLessThan(text.indexOf('could eat'));
  });
});

/**
 * The design called this the other way round — the miss winning — and the e2e suite refuted it inside the
 * hour: `cycle-163-first-impression` pins that a dino which has just seen you change chassis looks you
 * over again *and does not mention the old one*, which is BACKLOG-160's own checked arc. A new beat does
 * not get to silence a shipped one, so the order was reversed in the Coder fire and these are the tests
 * that hold it there.
 */
describe('precedence — the watcher standing there is introduced first', () => {
  it('says the first look and holds the miss back when both apply', () => {
    const text = cannedReply(base({ affection: 9, watcher: 'vanta', missed: 'aether' })).text;
    expect(text).toContain(watcherAside('vanta', traits).trim());
    expect(text).not.toContain(missAside('aether', traits).trim());
  });

  it('says the miss on the hello after, when the first look has been spent', () => {
    const text = cannedReply(base({ affection: 9, missed: 'aether' })).text;
    expect(text).toContain(missAside('aether', traits).trim());
  });

  it('still says the first look when nothing was missed', () => {
    const text = cannedReply(base({ affection: 9, watcher: 'vanta' })).text;
    expect(text).toContain(watcherAside('vanta', traits).trim());
  });
});

describe('the length-cap chain', () => {
  it('leaves a reply without a miss byte-identical', () => {
    for (const affection of [0, 9]) {
      const ctx = base({
        affection,
        hungry: true,
        rattled: 'Grip',
        provider: { name: 'Mossback', zoneName: 'the grove' },
        standing: 'waning',
        tasted: { label: 'greens', loved: true },
      });
      expect(cannedReply(ctx).text).toBe(cannedReply({ ...ctx, missed: undefined }).text);
    }
  });

  it('cuts nothing when the miss fires beside every other aside', () => {
    const text = cannedReply(
      base({
        affection: 9,
        missed: 'kestrel',
        hungry: true,
        rattled: 'Grip',
        provider: { name: 'Mossback', zoneName: 'the grove' },
        standing: 'waning',
        tasted: { label: 'greens', loved: true },
      }),
    ).text;
    expect(text).toContain(missAside('kestrel', traits).trim());
    expect(text).toContain('could eat');
    expect(text).toContain('Grip');
    expect(text).toContain('Mossback');
    expect(text).toContain('greens');
  });
});
