/**
 * BACKLOG-126 — the unsaid slight survives a reload, and a save that predates it opens clean.
 *
 * Additive: no `SAVE_VERSION` bump, so every pre-162 save is a valid 162 save with nothing unsaid.
 */
import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, deserialize } from './saveGame';
import { NEED_ART_KEY } from './needs';
import { worldPlacedProps } from './reachability';

/** The smallest object `deserialize` accepts — `bonds.test.ts`'s base, same job. */
function baseSave(): Record<string, unknown> {
  return {
    version: SAVE_VERSION,
    time: { day: 1, hour: 8, minute: 0 },
    player: { x: 10, y: 10 },
    friendship: {},
    memory: {},
  };
}

describe('envy in the save (BACKLOG-126)', () => {
  it('round-trips a pending slight', () => {
    const save = deserialize(JSON.stringify({ ...baseSave(), envy: { Glade: { eater: 'Rex', at: 12 } } }));
    expect(save?.envy).toEqual({ Glade: { eater: 'Rex', at: 12 } });
  });

  it('opens a pre-162 save with nothing unsaid', () => {
    const save = deserialize(JSON.stringify(baseSave()));
    expect(save).not.toBeNull();
    expect(save?.envy).toBeUndefined();
  });

  it('keeps an entry for a dino this build has never heard of', () => {
    // The `tasted`/`palate` discipline: a save from a future roster is a save. The entry is inert, because
    // nothing ever greets a dino that is not in the world.
    const save = deserialize(JSON.stringify({ ...baseSave(), envy: { Nobody: { eater: 'Alsonobody', at: 3 } } }));
    expect(save?.envy?.Nobody.eater).toBe('Alsonobody');
  });

  it('rejects a corrupt entry rather than loading half of it', () => {
    const bad = (envy: unknown) => deserialize(JSON.stringify({ ...baseSave(), envy }));
    expect(bad({ Glade: { eater: 'Rex' } })).toBeNull(); // no step
    expect(bad({ Glade: { eater: 7, at: 1 } })).toBeNull(); // eater is not a name
    expect(bad({ Glade: { eater: 'Rex', at: -1 } })).toBeNull(); // before the world began
    expect(bad({ Glade: { eater: 'Rex', at: Number.NaN } })).toBeNull();
    expect(bad([])).toBeNull();
  });
});

describe('the need tells are in the register (BACKLOG-551)', () => {
  it('both keys can be placed by the shipping world', () => {
    const placed = worldPlacedProps();
    // Read off `NEED_ART_KEY` rather than typed here: a rename must not be able to pass this.
    expect(placed.has(NEED_ART_KEY.hunger)).toBe(true);
    expect(placed.has(NEED_ART_KEY.thirst)).toBe(true);
  });

  it('the key and the glyph are declared for the same two needs', () => {
    expect(Object.keys(NEED_ART_KEY).sort()).toEqual(['hunger', 'thirst']);
  });
});
