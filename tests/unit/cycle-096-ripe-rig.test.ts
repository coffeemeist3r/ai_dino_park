import { describe, it, expect } from 'vitest';
import { ripeRigKey, CROP_FOOD_ID } from '../../game/src/world/plot';
import { PROP_RIGS } from '../../game/src/art/propArt';

const hasRig = (name: string) => name in PROP_RIGS;

/**
 * Per-crop ripe rig wiring (BACKLOG-434) — `drawPlotSprite` bakes each crop's OWN ripe rig. The bowl berry
 * keeps `crop_ripe` (byte-identical); the grove's greens resolve `crop_ripe_greens` (the rig stashed cycle 95).
 */
describe('ripeRigKey (BACKLOG-434)', () => {
  it('the berry crop keeps the original crop_ripe key (byte-identical bowl)', () => {
    expect(ripeRigKey(CROP_FOOD_ID)).toBe('crop_ripe');
  });

  it('every other crop reads crop_ripe_<food>', () => {
    expect(ripeRigKey('greens')).toBe('crop_ripe_greens');
    expect(ripeRigKey('fish')).toBe('crop_ripe_fish');
  });

  it('the bowl berry and grove greens ripe rigs both exist (so both bake, not glyph-fall back)', () => {
    expect(hasRig(ripeRigKey(CROP_FOOD_ID))).toBe(true);
    expect(hasRig(ripeRigKey('greens'))).toBe(true);
  });

  it('a crop with no stashed rig has no prop (drawPlotSprite falls back to its glyph)', () => {
    expect(hasRig(ripeRigKey('fish'))).toBe(false);
  });
});
