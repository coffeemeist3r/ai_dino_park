/**
 * Save-migration rail rooted at v0 (BACKLOG-426) — the milestone's persistence-spine close.
 *
 * The rail already existed (BACKLOG-040); what 426 adds is its origin: a *versionless* save was
 * being rejected and silently became a new game. Now a missing version is read as v0 and lifted
 * v0→v1 (no-op) then v1→v2, so every save ever written rides the chain — while a present-but-newer,
 * negative, or non-integer version is still rejected.
 */
import { describe, it, expect } from 'vitest';
import { serialize, deserialize, migrate, SAVE_VERSION } from '../../game/src/world/saveGame';

describe('migrate rooted at v0 (BACKLOG-426)', () => {
  it('reads a missing version as v0 and lifts it to the current version', () => {
    const out = migrate({ time: {}, player: {} });
    expect(out).not.toBeNull();
    expect(out!.version).toBe(SAVE_VERSION);
  });

  it('handles an explicit v0 identically', () => {
    expect(migrate({ version: 0 })!.version).toBe(SAVE_VERSION);
  });

  it('the v0→v1 step is a pure no-op on shape: it adds only `version`', () => {
    // Migrate a plain v0 object and confirm the only field the chain added is `version`.
    const src = { a: 1, b: 'two', c: [3] };
    const out = migrate({ ...src })!;
    const { version, ...rest } = out;
    expect(version).toBe(SAVE_VERSION);
    expect(rest).toEqual(src); // every other key byte-identical — no-op stamp
  });

  it('never mutates its input (pure)', () => {
    const src: Record<string, unknown> = { foo: 'bar' };
    migrate(src);
    expect(src.version).toBeUndefined();
  });

  it('still rejects a newer, negative, or non-integer version', () => {
    expect(migrate({ version: SAVE_VERSION + 1 })).toBeNull();
    expect(migrate({ version: -1 })).toBeNull();
    expect(migrate({ version: 1.5 })).toBeNull();
  });

  it('null version is a non-number → rejected (only absent coerces to v0)', () => {
    expect(migrate({ version: null } as unknown as Record<string, unknown>)).toBeNull();
  });
});

describe('deserialize loads a versionless save carrying a modern field (BACKLOG-426)', () => {
  it('a versionless payload with a personas cache survives the v0→v2 chain intact', () => {
    // A pre-versioning save that nonetheless carries a modern additive field must round-trip.
    const noVersion = JSON.stringify({
      time: { day: 4, hour: 10, minute: 30 },
      player: { x: 7, y: 8 },
      friendship: { Rex: 42 },
      personas: { Rex: { text: 'Rex the triceratops — loves rocks.', source: 'procedural' } },
    });
    const out = deserialize(noVersion);
    expect(out).not.toBeNull();
    expect(out!.version).toBe(SAVE_VERSION);
    expect(out!.friendship).toEqual({ Rex: 42 });
    expect(out!.personas).toEqual({ Rex: { text: 'Rex the triceratops — loves rocks.', source: 'procedural' } });
  });

  it('a versionless save re-serializes stamped at the current version', () => {
    const out = deserialize(JSON.stringify({ time: { day: 1, hour: 8, minute: 0 }, player: { x: 0, y: 0 } }))!;
    expect(JSON.parse(serialize(out)).version).toBe(SAVE_VERSION);
  });
});
