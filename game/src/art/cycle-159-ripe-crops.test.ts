/**
 * BACKLOG-548 — the last two ripe plots.
 *
 * `ripeRigKey` (plot.ts) has asked `zoneChain()` for one rig per ground since BACKLOG-434, and `PROP_RIGS`
 * answered three of five. These are the other two. The load-bearing assertion is the last one: every key
 * the register asks for now resolves, so a keeper walking east no longer watches the farming arc downgrade
 * from pixels to emoji halfway along the chain.
 */

import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from './propArt';
import { cropOf, ripeRigKey } from '../world/plot';
import { zoneChain } from '../world/zones';

const MUSHROOMS = PROP_RIGS['crop_ripe_mushrooms'];
const SEEDS = PROP_RIGS['crop_ripe_seeds'];
const RIPE = ['crop_ripe', 'crop_ripe_greens', 'crop_ripe_roots', 'crop_ripe_mushrooms', 'crop_ripe_seeds'];

describe('the two new ripe rigs exist and are well-formed', () => {
  for (const [name, rig] of [
    ['mushrooms', MUSHROOMS],
    ['seeds', SEEDS],
  ] as const) {
    it(`${name} is a square grid of its declared size`, () => {
      expect(rig, name).toBeTruthy();
      expect(rig.grid).toHaveLength(rig.size);
      for (const row of rig.grid) expect(row, `${name}: ${row}`).toHaveLength(rig.size);
    });

    it(`${name} keeps the palette under the eight-colour bar`, () => {
      expect(Object.keys(rig.palette).length, name).toBeLessThanOrEqual(8);
    });

    it(`${name} paints only characters its palette names`, () => {
      for (const row of rig.grid) {
        for (const ch of row) {
          if (ch === '.') continue;
          expect(rig.palette, `${name}: '${ch}'`).toHaveProperty(ch);
        }
      }
    });

    it(`${name} stands on the shared soil mound, like every other ripe crop`, () => {
      const painted = new Set(rig.grid.join('').split(''));
      for (const soil of ['o', 'm', 'h']) expect(painted, `${name}: ${soil}`).toContain(soil);
    });
  }
});

describe('the five ripe crops read apart', () => {
  it('no two of them are the same picture', () => {
    const grids = RIPE.map((k) => PROP_RIGS[k].grid.join('|'));
    expect(new Set(grids).size, 'two ripe plots draw identically').toBe(RIPE.length);
  });

  it('the plot is not the dropped food — the Hollow and the Ridge draw each twice, differently', () => {
    expect(MUSHROOMS.grid.join('|')).not.toBe(PROP_RIGS['food_mushrooms'].grid.join('|'));
    expect(SEEDS.grid.join('|')).not.toBe(PROP_RIGS['food_seeds'].grid.join('|'));
  });
});

describe('the claim this item was filed over', () => {
  it('every ground in the chain now has a rig for the crop it grows', () => {
    const missing = zoneChain().filter((z) => !(ripeRigKey(cropOf(z).food) in PROP_RIGS));
    expect(
      missing,
      'a ground whose ripe plot falls back to its emoji glyph while its neighbours draw pixels',
    ).toEqual([]);
  });
});
