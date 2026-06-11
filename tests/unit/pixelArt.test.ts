import { describe, it, expect } from 'vitest';
import { PIXEL_SPECIES, REX_RIG, MOSS_RIG, SUNNY_RIG, COMP_RIG, GLADE_RIG, charsUsed } from '../../game/src/art/pixelArt';

/** Count contiguous runs of painted (non-'.') pixels in a row — used to read leg groups. */
function paintedRuns(row: string): number {
  return (row.match(/[^.]+/g) ?? []).length;
}

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

describe('Sunny the brontosaurus pixel rig (BACKLOG-169)', () => {
  it('is a full 20×20 grid in every frame', () => {
    for (const frame of SUNNY_RIG.frames) {
      expect(frame).toHaveLength(SUNNY_RIG.size);
      for (const row of frame) expect(row).toHaveLength(SUNNY_RIG.size);
    }
  });

  it('every painted char resolves and keeps GBA palette discipline (≤ 15 distinct)', () => {
    const pal = SUNNY_RIG.palette(0xd8b84a);
    for (const frame of SUNNY_RIG.frames) {
      for (const ch of charsUsed(frame)) expect(pal[ch], `char '${ch}'`).toBeTypeOf('number');
    }
    const colors = Object.values(pal);
    expect(colors.length).toBeLessThanOrEqual(15);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('carries the long neck — paint in the top rows ahead of the body, the sauropod read', () => {
    const stand = SUNNY_RIG.frames[0];
    // Head + neck occupy the upper-left quarter: painted pixels in rows 0..5, all left of col 8.
    for (let y = 0; y <= 5; y++) {
      const painted = [...stand[y]].map((ch, x) => (ch !== '.' ? x : -1)).filter((x) => x >= 0);
      expect(painted.length, `row ${y}`).toBeGreaterThan(0);
      expect(Math.max(...painted), `row ${y}`).toBeLessThan(8);
    }
    expect(charsUsed(stand).has('e')).toBe(true); // eye up in the head
    expect(charsUsed(stand).has('o')).toBe(true); // dark outline
  });

  it('ambles: three distinct frames, the Gen3 stand-between-steps sequence', () => {
    const [stand, stepL, stepR] = SUNNY_RIG.frames;
    expect(stand).not.toEqual(stepL);
    expect(stand).not.toEqual(stepR);
    expect(stepL).not.toEqual(stepR);
    expect(SUNNY_RIG.sequence).toEqual([0, 1, 0, 2]);
  });

  it('keeps the bro prefix so the cycle-31 colour-keyed bake + e2e contract holds', () => {
    expect(SUNNY_RIG.prefix).toBe('bro');
    expect(PIXEL_SPECIES.brontosaurus).toBe(SUNNY_RIG);
  });
});

describe('Twitch the compsognathus pixel rig (BACKLOG-169)', () => {
  it('is a full 20×20 grid in every frame', () => {
    for (const frame of COMP_RIG.frames) {
      expect(frame).toHaveLength(COMP_RIG.size);
      for (const row of frame) expect(row).toHaveLength(COMP_RIG.size);
    }
  });

  it('every painted char resolves and keeps GBA palette discipline (≤ 15 distinct)', () => {
    const pal = COMP_RIG.palette(0x6a8a4a);
    for (const frame of COMP_RIG.frames) {
      for (const ch of charsUsed(frame)) expect(pal[ch], `char '${ch}'`).toBeTypeOf('number');
    }
    const colors = Object.values(pal);
    expect(colors.length).toBeLessThanOrEqual(15);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('stands on exactly two legs — the cast\'s only biped read', () => {
    const stand = COMP_RIG.frames[0];
    // The feet row (17) shows two separate leg groups, not a quadruped's four/splayed pairs.
    expect(paintedRuns(stand[17])).toBe(2);
    expect(charsUsed(stand).has('d')).toBe(true); // legs
    expect(charsUsed(stand).has('e')).toBe(true); // the forward alert eye
    expect(charsUsed(stand).has('k')).toBe(true); // the dorsal two-tone stripe
    expect(charsUsed(stand).has('o')).toBe(true); // dark outline
  });

  it('skitters: the legs scissor — three distinct frames, the Gen3 stand-between-steps sequence', () => {
    const [stand, stepL, stepR] = COMP_RIG.frames;
    expect(stand).not.toEqual(stepL);
    expect(stand).not.toEqual(stepR);
    expect(stepL).not.toEqual(stepR);
    // the upper body (rows 0..13) is identical across frames — only the legs move
    expect(stand.slice(0, 14)).toEqual(stepL.slice(0, 14));
    expect(stand.slice(0, 14)).toEqual(stepR.slice(0, 14));
    expect(COMP_RIG.sequence).toEqual([0, 1, 0, 2]);
  });

  it('keeps the comp prefix so the cycle-33 colour-keyed bake + e2e contract holds', () => {
    expect(COMP_RIG.prefix).toBe('comp');
    expect(PIXEL_SPECIES.compsognathus).toBe(COMP_RIG);
  });
});

describe('Glade the parasaurolophus pixel rig (BACKLOG-169 — the cast is 5/5 pixel)', () => {
  it('is a full 20×20 grid in every frame', () => {
    for (const frame of GLADE_RIG.frames) {
      expect(frame).toHaveLength(GLADE_RIG.size);
      for (const row of frame) expect(row).toHaveLength(GLADE_RIG.size);
    }
  });

  it('every painted char resolves and keeps GBA palette discipline (≤ 15 distinct)', () => {
    const pal = GLADE_RIG.palette(0x6a8a4a);
    for (const frame of GLADE_RIG.frames) {
      for (const ch of charsUsed(frame)) expect(pal[ch], `char '${ch}'`).toBeTypeOf('number');
    }
    const colors = Object.values(pal);
    expect(colors.length).toBeLessThanOrEqual(15);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('the tube crest is the silhouette: bone tone sweeps the top rows, longer than a horn stub', () => {
    const stand = GLADE_RIG.frames[0];
    const crestRows = stand.slice(1, 5).filter((row) => row.includes('h'));
    expect(crestRows.length).toBeGreaterThanOrEqual(3); // a 3-row sweep, not a stub
    expect(stand[1].indexOf('h')).toBeGreaterThan(stand[4].indexOf('h')); // rises up AND back
  });

  it('the tail merges into the body row — no outline column splitting the join', () => {
    const widest = GLADE_RIG.frames[0][12];
    expect(widest).toMatch(/^\.ob+o\.+$/); // one unbroken body run, Sunny's rejected hump bug pinned out
  });

  it('walk frames differ and play the Gen3 amble', () => {
    const [stand, stepL, stepR] = GLADE_RIG.frames;
    expect(stand).not.toEqual(stepL);
    expect(stand).not.toEqual(stepR);
    expect(stepL).not.toEqual(stepR);
    expect(GLADE_RIG.sequence).toEqual([0, 1, 0, 2]);
  });

  it('keeps the para prefix so the cycle-32 colour-keyed bake and e2e contract hold', () => {
    expect(GLADE_RIG.prefix).toBe('para');
    expect(PIXEL_SPECIES.parasaurolophus).toBe(GLADE_RIG);
  });
});
