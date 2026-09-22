import { describe, it, expect } from 'vitest';
import { KEEPERS, keeperById } from '../../game/src/keeper/keepers';
import { proceduralKeeperPersona, keeperIntroLines, KEEPER_LORE } from '../../game/src/keeper/persona';
import { PARK_LORE, PERSONA_MAX, fromPersonaDraft, upgradePersona } from '../../game/src/ai/persona';
import { switchTo, newRecord } from '../../game/src/keeper/record';

/**
 * BACKLOG-156 — the watcher's self.
 *
 * The item's real finding, and the reason it is designed render-first: `Keeper.backstory` has existed
 * since cycle 155 and had **no render site anywhere in the game**. So the assertions below are as much
 * about `keeperIntroLines` as about the persona — a self nobody reads is the failure v7 exists to catch.
 */
describe('BACKLOG-156 — the keeper persona (procedural floor)', () => {
  it('is deterministic: same keeper, byte-identical text', () => {
    for (const k of KEEPERS) {
      expect(proceduralKeeperPersona(k).text).toBe(proceduralKeeperPersona(k).text);
    }
  });

  it('gives every observer a different self', () => {
    const texts = KEEPERS.map((k) => proceduralKeeperPersona(k).text);
    expect(new Set(texts).size).toBe(KEEPERS.length);
  });

  it("keeps each observer's own hand-written backstory verbatim", () => {
    for (const k of KEEPERS) {
      expect(proceduralKeeperPersona(k).text).toContain(k.backstory);
    }
  });

  it('is the procedural floor, within the shared length cap', () => {
    for (const k of KEEPERS) {
      const p = proceduralKeeperPersona(k);
      expect(p.source).toBe('procedural');
      expect(p.text.length).toBeLessThanOrEqual(PERSONA_MAX);
      expect(p.text.length).toBeGreaterThan(40);
    }
  });

  it('seeds off the id, not the name — a cosmetic rename does not re-author a cached self', () => {
    const aki = keeperById('aether');
    const renamed = { ...aki, name: 'AETHER-1 "Akiko"' };
    expect(proceduralKeeperPersona(renamed).text).toBe(proceduralKeeperPersona(aki).text);
  });

  it('a different id does re-author, so the seed is genuinely the id', () => {
    const aki = keeperById('aether');
    const impostor = { ...aki, id: 'aether-2' };
    expect(proceduralKeeperPersona(impostor).text).not.toBe(proceduralKeeperPersona(aki).text);
  });

  it('composes the park canon rather than re-authoring it', () => {
    expect(KEEPER_LORE.startsWith(PARK_LORE)).toBe(true);
    expect(KEEPER_LORE.length).toBeGreaterThan(PARK_LORE.length);
  });
});

describe('BACKLOG-156 — the authored upgrade reuses the dino pipeline, it does not re-implement it', () => {
  it('a valid draft folds to an llm persona', () => {
    const floor = proceduralKeeperPersona(keeperById('vanta'));
    const up = upgradePersona(floor, 'It watches the bold ones and forgets to write anything down at all.');
    expect(up.source).toBe('llm');
    expect(up.text).toContain('forgets to write');
  });

  it('a null or too-short draft keeps the floor exactly', () => {
    const floor = proceduralKeeperPersona(keeperById('vanta'));
    expect(upgradePersona(floor, null)).toEqual(floor);
    expect(upgradePersona(floor, 'ok.')).toEqual(floor);
  });

  it('an authored self is settled forever — generate-once', () => {
    const authored = fromPersonaDraft('A long enough authored self to pass the draft floor.', proceduralKeeperPersona(KEEPERS[0]));
    expect(upgradePersona(authored, 'A second and different authored self, also long enough.')).toEqual(authored);
  });

  it('a switch drops the cache, so the next author writes the incoming observer (555 rule, now load-bearing)', () => {
    const rec = { ...newRecord('aether', 1), persona: proceduralKeeperPersona(keeperById('aether')) };
    expect(switchTo(rec, 'vanta', 2).persona).toBeUndefined();
  });
});

describe('BACKLOG-156 — the render (the reachability half)', () => {
  it('the picker confirmation is three lines, ending in the self', () => {
    const k = keeperById('lumen');
    const p = proceduralKeeperPersona(k);
    const lines = keeperIntroLines(k, p);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(`You are ${k.name}, from ${k.era}.`);
    expect(lines[1]).toBe(`${k.ability.label}: ${k.ability.desc}`);
    expect(lines[2]).toBe(p.text);
  });

  it('every observer renders a non-empty self — none of the four is a blank line', () => {
    for (const k of KEEPERS) {
      const lines = keeperIntroLines(k, proceduralKeeperPersona(k));
      expect(lines[2].trim().length).toBeGreaterThan(0);
    }
  });
});
