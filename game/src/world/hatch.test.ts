import { describe, expect, it } from 'vitest';
import { HATCH_ART_KEY, HATCH_SCATTER, HATCH_TILE, hatchLanding } from './hatch';
import { foodLanding } from './feeding';
import { BANK_TILE } from './bank';
import { PLOT_TILE_BY_ZONE } from './plot';
import { zoneChain, zoneTileAt, zoneWaterTile } from './zones';
import { FOUNDING_RUIN } from './founding';

const COLS = 20;
const ROWS = 15;
const HUDDLE_TILE = { tileX: 10, tileY: 11 }; // WorldScene's, restated here as the thing not to sit on

describe('the feeding hatch (BACKLOG-510)', () => {
  it('sits on the row food already landed on, so the feeding row does not move', () => {
    // Asserted against foodLanding itself rather than restating floor(rows * 0.45): the hatch and the
    // feeding row are one fact, and a comment is not a mechanism.
    expect(HATCH_TILE.tileY).toBe(foodLanding(COLS, ROWS, 0).tileY);
  });

  it('is not underwater on any ground in the park', () => {
    for (const zone of zoneChain()) {
      const kind = zoneTileAt(zone, HATCH_TILE.tileX, HATCH_TILE.tileY, COLS, ROWS);
      expect(kind, `${zone} drowns the hatch`).not.toBe('water');
    }
  });

  it('collides with nothing the park pins in place', () => {
    const same = (t: { tileX: number; tileY: number }) =>
      t.tileX === HATCH_TILE.tileX && t.tileY === HATCH_TILE.tileY;
    expect(same(BANK_TILE)).toBe(false);
    expect(same(HUDDLE_TILE)).toBe(false);
    expect(same(FOUNDING_RUIN)).toBe(false);
    for (const [zone, plot] of Object.entries(PLOT_TILE_BY_ZONE)) {
      expect(same(plot), `${zone}'s plot is on the hatch`).toBe(false);
    }
    for (const zone of zoneChain()) {
      const water = zoneWaterTile(zone, COLS, ROWS);
      if (water) expect(same(water), `${zone}'s water is on the hatch`).toBe(false);
    }
  });

  it('keys the rig BACKLOG-502 will draw, and draws nothing until it does', () => {
    expect(HATCH_ART_KEY).toBe('hatch');
  });
});

describe('the landing roll (BACKLOG-510)', () => {
  const band = (x: number) => Math.abs(x - HATCH_TILE.tileX) <= HATCH_SCATTER;

  it('never lands further than the scatter from the hatch', () => {
    for (let i = 0; i <= 20; i++) {
      const r = i / 20; // walks the whole [0,1) range the rng can hand it
      expect(band(hatchLanding(COLS, () => Math.min(r, 0.999)))).toBe(true);
    }
  });

  it('reaches both ends of the band', () => {
    expect(hatchLanding(COLS, () => 0)).toBe(HATCH_TILE.tileX - HATCH_SCATTER);
    expect(hatchLanding(COLS, () => 0.999)).toBe(HATCH_TILE.tileX + HATCH_SCATTER);
  });

  it('clamps to the map on a narrow ground', () => {
    expect(hatchLanding(4, () => 0.999)).toBe(3);
    expect(hatchLanding(1, () => 0)).toBe(0);
  });

  it('is the column foodLanding rolls when the caller names none', () => {
    expect(band(foodLanding(COLS, ROWS, undefined, () => 0).tileX)).toBe(true);
    expect(band(foodLanding(COLS, ROWS, undefined, () => 0.999).tileX)).toBe(true);
  });

  it('leaves the crop-harvest path exactly where it asks to be', () => {
    // WorldScene drops a ripe crop at its own plot column; that call passes `col` and must be untouched.
    expect(foodLanding(COLS, ROWS, 2).tileX).toBe(2);
    expect(foodLanding(COLS, ROWS, 99).tileX).toBe(COLS - 1);
  });
});
