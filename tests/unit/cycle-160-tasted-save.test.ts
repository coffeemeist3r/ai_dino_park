import { describe, it, expect } from 'vitest';
import { serialize, deserialize, SAVE_VERSION, type SaveData } from '../../game/src/world/saveGame';

/**
 * BACKLOG-069 — the menu record in the save. Additive over every save this park has ever written, and
 * shape-validated rather than vocabulary-validated: a food id or a dino name this build does not know is
 * kept, because a save from a future roster is a save (the `satchel` precedent).
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

describe('the menu record, round-tripped', () => {
  it('survives a reload', () => {
    const data: SaveData = { ...base, tasted: { Rex: ['greens', 'fish'] } };
    expect(deserialize(serialize(data))?.tasted).toEqual({ Rex: ['greens', 'fish'] });
  });

  it('a save that predates it still loads, with nothing discovered', () => {
    const parsed = deserialize(serialize(base));
    expect(parsed).not.toBeNull();
    expect(parsed?.tasted).toBeUndefined();
  });

  it('keeps an id this build has never heard of rather than refusing the save', () => {
    const raw = JSON.parse(serialize(base)) as Record<string, unknown>;
    raw.tasted = { Rex: ['kelp'], Nobody: ['greens'] };
    expect(deserialize(JSON.stringify(raw))?.tasted).toEqual({ Rex: ['kelp'], Nobody: ['greens'] });
  });

  it('refuses a wrong shape, which is the only thing it judges', () => {
    const raw = JSON.parse(serialize(base)) as Record<string, unknown>;
    raw.tasted = { Rex: 'greens' };
    expect(deserialize(JSON.stringify(raw))).toBeNull();
    raw.tasted = ['greens'];
    expect(deserialize(JSON.stringify(raw))).toBeNull();
  });
});
