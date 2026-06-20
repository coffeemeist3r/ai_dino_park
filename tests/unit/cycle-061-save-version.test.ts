import { describe, it, expect } from 'vitest';
import { serialize, deserialize, migrate, SAVE_VERSION, type SaveData } from '../../game/src/world/saveGame';

/**
 * Save format versioning + migration hook (BACKLOG-040). An older-version save is upgraded to the
 * current shape on load via the `migrate` chain rather than discarded; unknown/newer/missing versions
 * are still rejected. The v1→v2 step is a no-op stamp (every field since v1 was additive-optional).
 */

const validV2: SaveData = {
  version: SAVE_VERSION,
  time: { day: 1, hour: 8, minute: 0 },
  player: { x: 1, y: 2 },
  friendship: {},
  memory: {},
  bonds: {},
  gratitude: {},
  lastTone: {},
  zoneId: 'bowl',
  roles: {},
  eggs: [],
  born: [],
  scale: 1,
};

describe('SAVE_VERSION + serialize (BACKLOG-040)', () => {
  it('is now version 2', () => {
    expect(SAVE_VERSION).toBe(2);
  });
  it('serialize emits the current version', () => {
    expect(JSON.parse(serialize(validV2)).version).toBe(2);
  });
});

describe('migrate (BACKLOG-040)', () => {
  it('lifts a v1 object to v2 without mutating its input', () => {
    const v1 = { version: 1, foo: 'bar' };
    const out = migrate(v1);
    expect(out).not.toBeNull();
    expect(out!.version).toBe(2);
    expect(v1.version).toBe(1); // pure — input untouched
  });
  it('is identity for an already-current save', () => {
    const v2 = { version: 2, foo: 'bar' };
    expect(migrate(v2)).toEqual(v2);
  });
  it('rejects an unknown/newer version, a below-floor version, and a non-integer version', () => {
    expect(migrate({ version: 99 })).toBeNull();
    expect(migrate({ version: 0 })).toBeNull();
    expect(migrate({ version: 1.5 })).toBeNull();
    expect(migrate({})).toBeNull();
  });
});

describe('deserialize routes through migration (BACKLOG-040)', () => {
  it('a literal v1 save deserializes and comes back v2 (migration ran)', () => {
    const v1 = JSON.stringify({
      version: 1,
      time: { day: 3, hour: 21, minute: 14 },
      player: { x: 5, y: 6 },
      friendship: { Rex: 30 },
    });
    const out = deserialize(v1);
    expect(out).not.toBeNull();
    expect(out!.version).toBe(2);
    expect(out!.friendship).toEqual({ Rex: 30 });
  });

  it('an old v1 save with only a subset of additive fields still loads, defaults applied, as v2', () => {
    const v1 = JSON.stringify({
      version: 1,
      time: { day: 1, hour: 8, minute: 0 },
      player: { x: 1, y: 2 },
    });
    const out = deserialize(v1);
    expect(out).not.toBeNull();
    expect(out!.version).toBe(2);
    expect(out!.roles).toEqual({});
    expect(out!.keeperId).toBeUndefined();
    expect(out!.scale).toBe(1);
  });

  it('round-trips a current v2 save', () => {
    expect(deserialize(serialize(validV2))).toEqual(validV2);
  });

  it('rejects a newer (v99) save rather than mangling it', () => {
    const v99 = JSON.stringify({ ...validV2, version: 99 });
    expect(deserialize(v99)).toBeNull();
  });

  it('rejects a missing/non-numeric version', () => {
    expect(deserialize(JSON.stringify({ ...validV2, version: 'two' }))).toBeNull();
    const { version: _omit, ...noVersion } = validV2 as Record<string, unknown>;
    expect(deserialize(JSON.stringify(noVersion))).toBeNull();
  });
});
