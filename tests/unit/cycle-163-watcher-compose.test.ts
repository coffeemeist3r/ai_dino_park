import { describe, it, expect } from 'vitest';
import { cannedReply, type NPCContext } from '../../game/src/ai/brain';
import { watcherAside } from '../../game/src/keeper/voice';
import type { Personality } from '../../game/src/ai/personality';

/**
 * BACKLOG-160 — the first impression composes onto every register, and costs nothing when absent.
 *
 * The second half of this file is the guard the code plan called the cycle's silent hazard. `cannedReply`
 * appends its asides through a chain of `.slice()` caps (240 / 280 / 320 / 400 / 400 / 460 / 540 / 620).
 * Inserting a step without moving those caps truncates long replies, and **nothing in the suite would go
 * red** — the reply would simply get shorter. The caps are now `N + headroom`, and `headroom` is 0 for any
 * context without a watcher, so the whole existing chain keeps its exact numbers.
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

describe('the first impression composes onto every register', () => {
  const note = watcherAside('aether', traits);

  it('lands on the stranger hello — the one a fresh save actually gives you', () => {
    const reply = cannedReply(base({ affection: 5, watcher: 'aether' }));
    expect(reply.text).toContain(note.trim());
  });

  it('lands on the fond hello too', () => {
    expect(cannedReply(base({ affection: 9, watcher: 'aether' })).text).toContain(note.trim());
  });

  it('lands on the wistful hello too', () => {
    expect(cannedReply(base({ affection: 0, watcher: 'aether' })).text).toContain(note.trim());
  });

  it('lands on the gratitude register too', () => {
    expect(cannedReply(base({ affection: 5, gratitude: 'Mossback', watcher: 'aether' })).text).toContain(
      note.trim(),
    );
  });

  it('differs by which watcher you are — the whole point of the item', () => {
    const aki = cannedReply(base({ affection: 5, watcher: 'aether' })).text;
    const kes = cannedReply(base({ affection: 5, watcher: 'kestrel' })).text;
    expect(aki).not.toBe(kes);
  });

  it('comes before the hunger tell — a first impression outranks a want', () => {
    const text = cannedReply(base({ affection: 5, watcher: 'aether', hungry: true })).text;
    expect(text).toContain(note.trim());
    expect(text).toContain('could eat');
    expect(text.indexOf(note.trim())).toBeLessThan(text.indexOf('could eat'));
  });
});

describe('the length-cap chain', () => {
  it('leaves a reply without a watcher byte-identical', () => {
    // 0 (wistful) and 9 (fond) only — the mid-range register draws a random line from the canned pool, so
    // two calls to it differ from each other whatever this change does.
    for (const affection of [0, 9]) {
      const ctx = base({
        affection,
        hungry: true,
        rattled: 'Grip',
        provider: { name: 'Mossback', zoneName: 'the grove' },
        standing: 'waning',
        tasted: { label: 'greens', loved: true },
      });
      expect(cannedReply(ctx).text).toBe(cannedReply({ ...ctx, watcher: undefined }).text);
    }
  });

  it('cuts nothing when every aside fires at once', () => {
    const text = cannedReply(
      base({
        affection: 5,
        watcher: 'kestrel',
        hungry: true,
        rattled: 'Grip',
        provider: { name: 'Mossback', zoneName: 'the grove' },
        standing: 'waning',
        tasted: { label: 'greens', loved: true },
      }),
    ).text;
    // Every aside present in full — the watcher's, the hunger, the chase, the provider and the meal.
    expect(text).toContain(watcherAside('kestrel', traits).trim());
    expect(text).toContain('could eat');
    expect(text).toContain('Grip');
    expect(text).toContain('Mossback');
    expect(text).toContain('greens');
  });
});
