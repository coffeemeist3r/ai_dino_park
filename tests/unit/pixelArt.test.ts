import { describe, it, expect } from 'vitest';
import { PIXEL_SPECIES, REX_RIG, MOSS_RIG, charsUsed } from '../../game/src/art/pixelArt';

describe('pixel pipeline (BACKLOG-168, CHARTER v4)', () => {
  it('every frame is a full square grid', () => {
    for (const frame of REX_RIG.frames) {
      expect(frame).toHaveLength(REX_RIG.size);
      for (const row of frame) expect(row).toHaveLength(REX_RIG.size);
    }
  });

  it('every painted char resolves in the palette', () => {
    const pal = REX_RIG.palette(0x8a4a3a);
    for (const frame of REX_RIG.frames) {
      for (const ch of charsUsed(frame)) expect(pal[ch], `char '${ch}'`).toBeTypeOf('number');
    }
  });

  it('keeps GBA palette discipline: ≤ 15 colors + transparency, all distinct', () => {
    const pal = REX_RIG.palette(0x8a4a3a);
    const colors = Object.values(pal);
    expect(colors.length).toBeLessThanOrEqual(15);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('the walk frames actually differ (and stand differs from both steps)', () => {
    const [stand, stepL, stepR] = REX_RIG.frames;
    expect(stand).not.toEqual(stepL);
    expect(stand).not.toEqual(stepR);
    expect(stepL).not.toEqual(stepR);
  });

  it('plays the Gen3 amble: stand between steps', () => {
    expect(REX_RIG.sequence).toEqual([0, 1, 0, 2]);
    for (const i of REX_RIG.sequence) expect(REX_RIG.frames[i]).toBeDefined();
  });

  it('every frame carries the dark outline', () => {
    for (const frame of REX_RIG.frames) expect(charsUsed(frame).has('o')).toBe(true);
  });

  it('Rex keeps the tri prefix so colour-keyed bakes and old specs stay stable', () => {
    expect(REX_RIG.prefix).toBe('tri');
    expect(PIXEL_SPECIES.triceratops).toBe(REX_RIG);
  });

  it('palette derives from the base color (recolorable like the vector rigs)', () => {
    const a = REX_RIG.palette(0x8a4a3a);
    const b = REX_RIG.palette(0x4a8a3a);
    expect(a.b).not.toBe(b.b);
    expect(a.h).toBe(b.h); // shared bone tone is base-independent
  });
});

describe('Mossback the stegosaurus pixel rig (BACKLOG-169)', () => {
  it('is a full 20×20 grid in every frame', () => {
    for (const frame of MOSS_RIG.frames) {
      expect(frame).toHaveLength(MOSS_RIG.size);
      for (const row of frame) expect(row).toHaveLength(MOSS_RIG.size);
    }
  });

  it('every painted char resolves and keeps GBA palette discipline (≤ 15 distinct)', () => {
    const pal = MOSS_RIG.palette(0x4a7a4a);
    for (const frame of MOSS_RIG.frames) {
      for (const ch of charsUsed(frame)) expect(pal[ch], `char '${ch}'`).toBeTypeOf('number');
    }
    const colors = Object.values(pal);
    expect(colors.length).toBeLessThanOrEqual(15);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('carries the plates and the thagomizer — the stegosaurus silhouette read', () => {
    const stand = MOSS_RIG.frames[0];
    expect(charsUsed(stand).has('p')).toBe(true); // dorsal plates
    expect(charsUsed(stand).has('h')).toBe(true); // bone tail spikes
    expect(charsUsed(stand).has('o')).toBe(true); // dark outline
  });

  it('ambles: three distinct frames, the Gen3 stand-between-steps sequence', () => {
    const [stand, stepL, stepR] = MOSS_RIG.frames;
    expect(stand).not.toEqual(stepL);
    expect(stand).not.toEqual(stepR);
    expect(stepL).not.toEqual(stepR);
    expect(MOSS_RIG.sequence).toEqual([0, 1, 0, 2]);
  });

  it('keeps the steg prefix so the cycle-35 colour-keyed bake + e2e contract holds', () => {
    expect(MOSS_RIG.prefix).toBe('steg');
    expect(PIXEL_SPECIES.stegosaurus).toBe(MOSS_RIG);
  });
});
