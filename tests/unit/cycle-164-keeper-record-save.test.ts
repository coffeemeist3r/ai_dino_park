import { describe, it, expect } from 'vitest';
import { serialize, deserialize, SAVE_VERSION, type SaveData } from '../../game/src/world/saveGame';
import { recordFrom } from '../../game/src/keeper/record';
import { proceduralKeeperPersona } from '../../game/src/keeper/persona';
import { keeperById } from '../../game/src/keeper/keepers';

/**
 * BACKLOG-555 — the watcher's record in the save. Strictly additive over every save this park has
 * ever written: the CHARTER's additive-save rule is the *point* of this item, not a constraint on
 * it, so the old-shaped fixture below is the test that matters most in this file.
 *
 * Validated in the `personas` idiom one block up: undefined passes through, malformed rejects, and
 * the two optional members are checked only when present.
 */
const base = {
  version: SAVE_VERSION,
  time: { day: 1, hour: 8, minute: 0 },
  player: { x: 0, y: 0 },
  friendship: {},
  memory: {},
  bonds: {},
  gratitude: {},
  lastTone: {},
} as unknown as SaveData;

const rec = { id: 'vanta', sinceDay: 3, switches: 1, previousId: 'aether' };

describe('the watcher record, round-tripped', () => {
  it('survives a reload unchanged', () => {
    expect(deserialize(serialize({ ...base, keeper: rec }))?.keeper).toEqual(rec);
  });

  it('carries 156\'s persona slot when one is present', () => {
    const withPersona = { ...rec, persona: { text: 'a scout from a timeline that ended', source: 'llm' } };
    expect(deserialize(serialize({ ...base, keeper: withPersona }))?.keeper).toEqual(withPersona);
  });

  // BACKLOG-156, the cycle that filled the slot: the assertion above used a hand-written literal, which
  // proves the save block and not the thing that writes it. This one round-trips a persona the production
  // author actually produced, so a change to `proceduralKeeperPersona` that the save cannot carry is red.
  it("carries a persona the keeper's own author produced", () => {
    const authored = { ...rec, persona: proceduralKeeperPersona(keeperById('vanta')) };
    expect(deserialize(serialize({ ...base, keeper: authored }))?.keeper).toEqual(authored);
  });

  it('keeps previousId absent rather than writing it as undefined', () => {
    const fresh = { id: 'aether', sinceDay: 1, switches: 0 };
    const out = deserialize(serialize({ ...base, keeper: fresh }))?.keeper;
    expect(out).toEqual(fresh);
    expect(out && 'previousId' in out).toBe(false);
  });
});

describe('a save written before this cycle', () => {
  it('loads, with no record at all', () => {
    const raw = JSON.parse(serialize({ ...base, keeperId: 'lumen' })) as Record<string, unknown>;
    delete raw.keeper;
    const out = deserialize(JSON.stringify(raw));
    expect(out).not.toBeNull();
    expect(out?.keeper).toBeUndefined();
    expect(out?.keeperId).toBe('lumen');
  });

  // The seam: the parser leaves it undefined, the caller seeds it. Together those are the migration,
  // and there is no migration step.
  it('is seeded from its bare keeperId by the caller', () => {
    const raw = JSON.parse(serialize({ ...base, keeperId: 'lumen' })) as Record<string, unknown>;
    delete raw.keeper;
    const out = deserialize(JSON.stringify(raw))!;
    expect(recordFrom(out.keeper, out.keeperId, 9)).toEqual({ id: 'lumen', sinceDay: 9, switches: 0 });
  });
});

describe('a malformed record is rejected, not coerced', () => {
  const reject = (keeper: unknown) => {
    const raw = JSON.parse(serialize({ ...base })) as Record<string, unknown>;
    raw.keeper = keeper;
    expect(deserialize(JSON.stringify(raw))).toBeNull();
  };

  it('rejects a null record', () => reject(null));
  it('rejects a string record', () => reject('aether'));
  it('rejects a missing id', () => reject({ sinceDay: 1, switches: 0 }));
  it('rejects a non-string id', () => reject({ id: 3, sinceDay: 1, switches: 0 }));
  it('rejects a non-number sinceDay', () => reject({ id: 'aether', sinceDay: 'one', switches: 0 }));
  it('rejects a non-number switches', () => reject({ id: 'aether', sinceDay: 1, switches: 'two' }));
  it('rejects a non-finite sinceDay', () => reject({ id: 'aether', sinceDay: NaN, switches: 0 }));
  it('rejects a non-string previousId', () => reject({ id: 'aether', sinceDay: 1, switches: 1, previousId: 7 }));
  it('rejects a half-typed persona', () =>
    reject({ id: 'aether', sinceDay: 1, switches: 0, persona: { text: 1, source: 'llm' } }));
  it('rejects a null persona', () => reject({ id: 'aether', sinceDay: 1, switches: 0, persona: null }));
});
