import { describe, it, expect } from 'vitest';
import { serialize, deserialize, SAVE_VERSION, type SaveData } from '../../game/src/world/saveGame';

/**
 * BACKLOG-068 — the warming record in the save. Additive over every save this park has ever written.
 *
 * Shape-validated the way `tasted` is one block up — an unknown dino or food id is *kept*, because a
 * save from a future roster is a save — with the `satchel` block's number check on top, because a count
 * that is not a finite non-negative number is not a future roster, it is a corrupt save.
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

describe('the warming record, round-tripped', () => {
  it('survives a reload', () => {
    const data: SaveData = { ...base, palate: { Rex: { greens: 3, fish: 1 } } };
    expect(deserialize(serialize(data))?.palate).toEqual({ Rex: { greens: 3, fish: 1 } });
  });

  it('a save written before this cycle opens with nobody warm', () => {
    const raw = JSON.parse(serialize({ ...base })) as Record<string, unknown>;
    delete raw.palate;
    expect(deserialize(JSON.stringify(raw))?.palate).toBeUndefined();
  });

  it('keeps a dino name and a food id this build has never heard of', () => {
    const raw = JSON.parse(serialize({ ...base })) as Record<string, unknown>;
    raw.palate = { Nobody: { kelp: 2 } };
    expect(deserialize(JSON.stringify(raw))?.palate).toEqual({ Nobody: { kelp: 2 } });
  });

  it('floors a fractional count rather than carrying a half-eaten meal', () => {
    const raw = JSON.parse(serialize({ ...base })) as Record<string, unknown>;
    raw.palate = { Rex: { greens: 2.7 } };
    expect(deserialize(JSON.stringify(raw))?.palate).toEqual({ Rex: { greens: 2 } });
  });

  it('rejects a count that is negative, infinite, or not a number at all', () => {
    for (const bad of [-1, Infinity, NaN, 'three', null]) {
      const raw = JSON.parse(serialize({ ...base })) as Record<string, unknown>;
      raw.palate = { Rex: { greens: bad } };
      expect(deserialize(JSON.stringify(raw)), String(bad)).toBeNull();
    }
  });

  it('rejects a palate that is not a map of maps', () => {
    for (const bad of [[], 'x', { Rex: ['greens'] }, { Rex: 3 }]) {
      const raw = JSON.parse(serialize({ ...base })) as Record<string, unknown>;
      raw.palate = bad;
      expect(deserialize(JSON.stringify(raw)), JSON.stringify(bad)).toBeNull();
    }
  });
});
