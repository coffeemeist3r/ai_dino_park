import { describe, it, expect } from 'vitest';
import {
  PERSONA_MAX,
  PARK_LORE,
  proceduralPersona,
  fromPersonaDraft,
  upgradePersona,
  type Persona,
} from '../../game/src/ai/persona';
import { seededPersonality } from '../../game/src/ai/personality';
import { buildMessages, buildPersonaMessages } from '../../game/src/ai/webllmBrain';
import { ROSTER } from '../../game/src/entities/roster';
import { serialize, deserialize, SAVE_VERSION, type SaveData } from '../../game/src/world/saveGame';

const rex = () => proceduralPersona('Rex', 'triceratops', 'curious, friendly, loves rocks', seededPersonality('Rex'));

describe('proceduralPersona (BACKLOG-103) — the deterministic floor', () => {
  it('is byte-identical across calls and bounded', () => {
    const a = rex();
    const b = rex();
    expect(a.text).toBe(b.text);
    expect(a.source).toBe('procedural');
    expect(a.text.length).toBeGreaterThan(0);
    expect(a.text.length).toBeLessThanOrEqual(PERSONA_MAX);
  });

  it('keeps the hand-written roster flavor in the self', () => {
    expect(rex().text).toContain('curious, friendly, loves rocks');
  });

  it('gives the five roster dinos pairwise-distinct selves', () => {
    const texts = ROSTER.map((r) => proceduralPersona(r.name, r.species, r.personality, seededPersonality(r.name)).text);
    expect(new Set(texts).size).toBe(ROSTER.length);
  });
});

describe('fromPersonaDraft (BACKLOG-103) — untrusted model text', () => {
  const fallback: Persona = { text: 'the floor persona, deterministic and fine', source: 'procedural' };

  it('keeps the fallback for null, empty, and too-short drafts', () => {
    expect(fromPersonaDraft(null, fallback)).toEqual(fallback);
    expect(fromPersonaDraft('', fallback)).toEqual(fallback);
    expect(fromPersonaDraft('   ok.  ', fallback)).toEqual(fallback);
  });

  it('accepts a real draft as llm-sourced, capped at a word boundary', () => {
    const good = fromPersonaDraft('A quiet dino who counts clouds and wants the pond to itself.', fallback);
    expect(good.source).toBe('llm');
    const long = fromPersonaDraft('word '.repeat(100), fallback);
    expect(long.text.length).toBeLessThanOrEqual(PERSONA_MAX);
    expect(long.text.endsWith('…')).toBe(true);
    expect(long.text).not.toMatch(/\swor…$/); // cut fell on a word boundary, not mid-word
  });
});

describe('upgradePersona (BACKLOG-103) — generate once, reuse forever', () => {
  it('never re-authors an llm persona', () => {
    const settled: Persona = { text: 'An authored self the model already wrote once here.', source: 'llm' };
    expect(upgradePersona(settled, 'A brand new draft that would replace it if allowed to.')).toBe(settled);
  });

  it('upgrades a procedural persona once on a valid draft, keeps it on a bad one', () => {
    const floor: Persona = { text: 'the floor persona, deterministic and fine', source: 'procedural' };
    expect(upgradePersona(floor, null)).toEqual(floor);
    expect(upgradePersona(floor, 'A real authored self with a want and a fear in it.').source).toBe('llm');
  });
});

describe('the persona reaches the prompt (BACKLOG-103)', () => {
  it('buildMessages carries the persona text in the system message', () => {
    const persona = rex();
    const msgs = buildMessages(
      { name: 'Rex', species: 'triceratops', personality: persona.text, traits: seededPersonality('Rex') },
      { kind: 'player_greet' },
    );
    expect(msgs[0].role).toBe('system');
    expect(msgs[0].content).toContain(persona.text);
  });

  it('buildPersonaMessages authors from park lore + the roster flavor', () => {
    const msgs = buildPersonaMessages({ name: 'Rex', species: 'triceratops', personality: 'curious, friendly, loves rocks' });
    expect(msgs[0].content).toContain(PARK_LORE);
    expect(msgs[1].content).toContain('curious, friendly, loves rocks');
  });
});

describe('personas ride the save (BACKLOG-103, additive)', () => {
  const base: SaveData = {
    version: SAVE_VERSION,
    time: { day: 1, hour: 8, minute: 0 },
    player: { x: 100, y: 100 },
    friendship: {},
    memory: {},
    bonds: {},
    gratitude: {},
    lastTone: {},
    eggs: [],
    born: [],
  };

  it('round-trips a persona entry', () => {
    const out = deserialize(serialize({ ...base, personas: { Rex: { text: 'a self', source: 'procedural' } } }));
    expect(out?.personas).toEqual({ Rex: { text: 'a self', source: 'procedural' } });
  });

  it('an old save without personas still loads (absent → undefined; caller defaults to {})', () => {
    const out = deserialize(serialize(base));
    expect(out).not.toBeNull();
    expect(out?.personas).toBeUndefined();
  });

  it('rejects a malformed personas field rather than guessing', () => {
    expect(deserialize(serialize({ ...base, personas: { Rex: { text: 42, source: 'x' } } } as unknown as SaveData))).toBeNull();
  });
});
