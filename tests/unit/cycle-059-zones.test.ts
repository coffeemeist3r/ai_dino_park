import { describe, it, expect } from 'vitest';
import {
  BOWL_ID,
  GROVE_ID,
  ZONES,
  zoneById,
  crossing,
  linkedZone,
  setZone,
  zoneOf,
} from '../../game/src/world/zones';
import { serialize, deserialize, SAVE_VERSION } from '../../game/src/world/saveGame';

/**
 * Connected zone (BACKLOG-143). Pure spine: edge-crossing + the linked neighbour's entry pixel + a
 * per-entity occupancy map, plus the additive `zoneId` save field. Grid: 20×15 tiles of 32px.
 */

const COLS = 20;
const TILE = 32;
const W = COLS * TILE; // 640

describe('crossing (BACKLOG-143)', () => {
  it('returns east past the east edge, null inside', () => {
    expect(crossing(W, COLS, TILE)).toBe('east'); // past max (640 > 640-16)
    expect(crossing(W / 2, COLS, TILE)).toBeNull();
  });

  it('returns west past the west edge', () => {
    expect(crossing(0, COLS, TILE)).toBe('west'); // 0 < 16
    expect(crossing(TILE, COLS, TILE)).toBeNull(); // 32 is well inside
  });
});

describe('linkedZone (BACKLOG-143)', () => {
  it('bowl east → grove, entry on the west side, y preserved', () => {
    const link = linkedZone(BOWL_ID, 'east', 200, COLS, TILE);
    expect(link?.zoneId).toBe(GROVE_ID);
    expect(link!.entry.x).toBeLessThan(W / 2);
    expect(link!.entry.y).toBe(200);
  });

  it('grove west → bowl, entry on the east side, y preserved', () => {
    const link = linkedZone(GROVE_ID, 'west', 120, COLS, TILE);
    expect(link?.zoneId).toBe(BOWL_ID);
    expect(link!.entry.x).toBeGreaterThan(W / 2);
    expect(link!.entry.y).toBe(120);
  });

  it('returns null for an unlinked edge (bowl west clamps normally)', () => {
    expect(linkedZone(BOWL_ID, 'west', 100, COLS, TILE)).toBeNull();
    expect(linkedZone(GROVE_ID, 'east', 100, COLS, TILE)).toBeNull();
  });
});

describe('occupancy API (BACKLOG-143)', () => {
  it('setZone / zoneOf round-trip with a fallback for unset ids', () => {
    const m: Record<string, string> = {};
    expect(zoneOf(m, 'Rex', BOWL_ID)).toBe(BOWL_ID);
    setZone(m, 'Rex', GROVE_ID);
    expect(zoneOf(m, 'Rex', BOWL_ID)).toBe(GROVE_ID);
  });

  it('zoneById falls back to the bowl for an unknown id', () => {
    expect(zoneById(GROVE_ID).name).toBe('The Grove');
    expect(zoneById('nope').id).toBe(ZONES[0].id);
  });
});

describe('save round-trips zoneId additively (BACKLOG-143)', () => {
  const base = {
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

  it('serialize → deserialize preserves zoneId', () => {
    const out = deserialize(serialize({ ...base, zoneId: GROVE_ID } as any));
    expect(out?.zoneId).toBe(GROVE_ID);
  });

  it('a save without zoneId defaults to the bowl (old saves still valid)', () => {
    const out = deserialize(serialize(base as any));
    expect(out).not.toBeNull();
    expect(out?.zoneId).toBe(BOWL_ID);
  });
});
