import { describe, it, expect } from 'vitest';
import {
  fernreachTileAt,
  groveTileAt,
  zoneTileAt,
  FERNREACH_TINT,
  type TileKind,
} from '../../game/src/world/zones';

/**
 * Third-zone terrain identity (BACKLOG-399) — The Fernreach gets its own ground layout so it reads as a
 * distinct *place*, not tinted bowl grass. Pure layout test (the render lives in bake.ts / WorldScene):
 * the sub-regions land where expected, the layout differs from the grove, and the per-zone dispatcher
 * routes each zone to its own layout (the bowl to none).
 */

const COLS = 20;
const ROWS = 15;

describe('fernreachTileAt (BACKLOG-399)', () => {
  it('runs a water creek down the west side', () => {
    expect(fernreachTileAt(3, 5, COLS, ROWS)).toBe('water');
    expect(fernreachTileAt(4, ROWS - 3, COLS, ROWS)).toBe('water');
  });

  it('puts fern scrub in the southern band', () => {
    expect(fernreachTileAt(10, ROWS - 1, COLS, ROWS)).toBe('fern');
  });

  it('is grass away from the creek and scrub', () => {
    expect(fernreachTileAt(10, 6, COLS, ROWS)).toBe('grass'); // mid, clear of everything
  });

  it('contains at least one tile of each of its kinds and only valid kinds', () => {
    const counts: Record<TileKind, number> = { grass: 0, path: 0, water: 0, fern: 0 };
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const k = fernreachTileAt(x, y, COLS, ROWS);
        expect(['grass', 'water', 'fern']).toContain(k); // the Fernreach uses no path band
        counts[k]++;
      }
    }
    expect(counts.water).toBeGreaterThan(0);
    expect(counts.fern).toBeGreaterThan(0);
    expect(counts.grass).toBeGreaterThan(0);
  });

  it('lays out unlike the grove (distinct place, not a clone)', () => {
    let differs = false;
    for (let y = 0; y < ROWS && !differs; y++) {
      for (let x = 0; x < COLS; x++) {
        if (fernreachTileAt(x, y, COLS, ROWS) !== groveTileAt(x, y, COLS, ROWS)) {
          differs = true;
          break;
        }
      }
    }
    expect(differs).toBe(true);
  });

  it('exposes a non-neutral Fernreach tint', () => {
    expect(FERNREACH_TINT).not.toBe(0xffffff);
  });
});

describe('zoneTileAt dispatcher (BACKLOG-399)', () => {
  it('routes the grove to groveTileAt', () => {
    for (const [x, y] of [[3, 3], [10, 7], [COLS - 3, 3]] as const) {
      expect(zoneTileAt('grove', x, y, COLS, ROWS)).toBe(groveTileAt(x, y, COLS, ROWS));
    }
  });

  it('routes the Fernreach to fernreachTileAt', () => {
    for (const [x, y] of [[3, 5], [10, ROWS - 1], [10, 6]] as const) {
      expect(zoneTileAt('fernreach', x, y, COLS, ROWS)).toBe(fernreachTileAt(x, y, COLS, ROWS));
    }
  });

  // BACKLOG-445 updated this: the bowl used to be the one zone with no layout at all (null → the caller
  // baked plain grass), which is exactly why a thirsty dino there had nowhere to drink. It has its own
  // waterhole now, so the dispatcher answers for it too — but it is still neither grove nor Fernreach
  // ground, which is what this test was really guarding. An unknown zone id keeps the old null contract.
  it('routes the bowl to its own ground, and only an unknown zone to null', () => {
    expect(zoneTileAt('bowl', 10, 7, COLS, ROWS)).toBe('grass');
    expect(zoneTileAt('bowl', 3, 2, COLS, ROWS)).toBe('water'); // the NW waterhole
    // the Fernreach's west creek runs through (3,7); the bowl's ground there is plain grass
    expect(fernreachTileAt(3, 7, COLS, ROWS)).toBe('water');
    expect(zoneTileAt('bowl', 3, 7, COLS, ROWS)).toBe('grass');
    expect(zoneTileAt('nowhere', 0, 0, COLS, ROWS)).toBeNull();
  });
});
