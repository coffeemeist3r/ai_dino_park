import { describe, expect, it } from 'vitest';
import { ateFavoriteMemory, ateMemory, lastTaste } from '../../game/src/world/foods';
import { cannedReply, tasteAside } from '../../game/src/ai/brain';
import { buildMessages } from '../../game/src/ai/webllmBrain';
import type { Personality } from '../../game/src/ai/personality';

/**
 * Taste talk (BACKLOG-066) — the park has computed a favorite food for every dino since cycle 25 and never
 * once let one *say* it. The memory ring is the freshness gate, exactly as it is for the contested drop
 * (BACKLOG-404 / cycle-131), so a dino mentions its dinner for as long as the dinner is one of the last six
 * things that happened to it and then stops without anything having to remember to stop it.
 */

const traits = (agreeableness: number): Personality => ({
  bravery: 0.5,
  curiosity: 0.5,
  sociability: 0.5,
  energy: 0.5,
  agreeableness,
});

const PRICKLY = traits(0.1);
const EVEN = traits(0.5);
const WARM = traits(0.9);

describe('BACKLOG-066 — the meal memories are builders, not literals', () => {
  it('the favorite memory names the food and says it is the favorite', () => {
    expect(ateFavoriteMemory('silver fish')).toContain('silver fish');
    expect(ateFavoriteMemory('silver fish')).toContain('favorite');
  });

  it('the plain memory names no food at all', () => {
    // A dino that ate something unremarkable does not remember which unremarkable thing it was.
    for (const label of ['silver fish', 'hunk of meat', 'sweet berries', 'pale mushrooms']) {
      expect(ateMemory()).not.toContain(label);
    }
  });
});

describe('BACKLOG-066 — reading the last meal off the ring', () => {
  it('a dino that has not eaten has nothing to say', () => {
    expect(lastTaste([])).toBeNull();
    expect(lastTaste(['the human stopped by to say hello'])).toBeNull();
  });

  it('reads a loved meal, with the food named', () => {
    expect(lastTaste([ateFavoriteMemory('silver fish')])).toEqual({ label: 'silver fish', loved: true });
  });

  it('reads a plain meal as not loved', () => {
    expect(lastTaste([ateMemory()])).toEqual({ label: '', loved: false });
  });

  it('reads the most recent meal when the ring holds two', () => {
    // `remember` appends, so the newest memory is last.
    const ring = [ateFavoriteMemory('silver fish'), 'the human stopped by to say hello', ateMemory()];
    expect(lastTaste(ring)?.loved).toBe(false);
    expect(lastTaste([ateMemory(), ateFavoriteMemory('sweet berries')])).toEqual({
      label: 'sweet berries',
      loved: true,
    });
  });

  it('goes quiet once the meal has rolled off the six-slot ring', () => {
    // The ring IS the freshness gate — no timer, no field, no save key. Six later memories push it off.
    const later = Array.from({ length: 6 }, (_, i) => `something else happened (${i})`);
    expect(lastTaste(later)).toBeNull();
  });
});

describe('BACKLOG-066 — the meal in the dino’s own mouth', () => {
  const all = [
    tasteAside('silver fish', true, PRICKLY),
    tasteAside('silver fish', true, EVEN),
    tasteAside('silver fish', true, WARM),
    tasteAside('', false, PRICKLY),
    tasteAside('', false, EVEN),
    tasteAside('', false, WARM),
  ];

  it('is six distinct lines — three temperaments, loved and not', () => {
    expect(new Set(all).size).toBe(6);
  });

  it('every line composes onto an existing reply, so it leads with a space', () => {
    for (const line of all) expect(line.startsWith(' ')).toBe(true);
  });

  it('the loved half always names the food, because that is the whole point', () => {
    for (const t of [PRICKLY, EVEN, WARM]) expect(tasteAside('silver fish', true, t)).toContain('silver fish');
  });

  it('two dinos handed the same food do not say the same thing', () => {
    // Sameness across dinos is a defect, not a state to accept (CHARTER "Living minds").
    expect(tasteAside('silver fish', true, PRICKLY)).not.toBe(tasteAside('silver fish', true, WARM));
  });

  it('falls back to the even line with no traits', () => {
    expect(tasteAside('silver fish', true)).toBe(tasteAside('silver fish', true, EVEN));
  });
});

describe('BACKLOG-066 — composed into the reply', () => {
  const base = { name: 'Thornback', species: 'triceratops', personality: 'loves rocks', traits: EVEN };

  it('a dino that just ate lets it into its line', () => {
    const reply = cannedReply({ ...base, tasted: { label: 'silver fish', loved: true } });
    expect(reply.text).toContain('silver fish');
  });

  it('a dino that has not eaten says nothing about food', () => {
    // Byte-identity: a context without `tasted` must return exactly what it returned before this existed.
    // Pinned on the wistful register (affection 0) rather than the generic one, whose greeting is drawn at
    // random — the assertion is about the aside composing, not about the roll.
    const without = cannedReply({ ...base, affection: 0 });
    const alsoWithout = cannedReply({ ...base, affection: 0, tasted: undefined });
    expect(alsoWithout.text).toBe(without.text);
    expect(without.text).not.toContain('silver fish');
  });

  it('the prompt carries the fact, naming the food', () => {
    const msgs = buildMessages(
      { ...base, tasted: { label: 'silver fish', loved: true } },
      { kind: 'player_greet' },
    );
    expect(JSON.stringify(msgs)).toContain('silver fish');
  });

  it('the prompt omits the clause when there is no meal to mention', () => {
    const msgs = buildMessages({ ...base }, { kind: 'player_greet' });
    expect(JSON.stringify(msgs)).not.toContain('at the hatch');
  });
});
