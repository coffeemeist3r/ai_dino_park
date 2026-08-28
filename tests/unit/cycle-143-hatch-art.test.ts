import { describe, it, expect } from 'vitest';
import { PROP_RIGS, NO_RIG_CONTROL } from '../../game/src/art/propArt';
import { HATCH_ART_KEY } from '../../game/src/world/hatch';

/**
 * The feeding hatch, drawn (BACKLOG-502, wired the same cycle by BACKLOG-510).
 *
 * `cycle-066-propart` already pins grid shape, palette size and non-emptiness for every rig in the registry.
 * What it cannot pin is the one thing this rig exists to be: **the odd artefact**. Every other prop in the
 * park is dino-made or grown — organic outlines, earth palettes, lit on the top-left and shadowed at the
 * bottom like an object standing on the ground. The hatch is keeper-made and set *into* the ground, and if
 * it does not read that way it is a manhole cover lying on the grass.
 */

const RIG = PROP_RIGS[HATCH_ART_KEY];
const grid = RIG.grid;
const at = (x: number, y: number) => grid[y][x];
const rowOf = (ch: string) => grid.findIndex((r) => r.includes(ch));

describe('the feeding hatch, drawn (BACKLOG-502)', () => {
  it('is the rig the wiring has been asking for by name', () => {
    expect(HATCH_ART_KEY).toBe('hatch');
    expect(RIG).toBeDefined();
    expect(RIG.size).toBe(16);
  });

  it('reads as sunk, not as a plate lying on the grass', () => {
    // The whole drawing. Every other prop lights its top and shadows its bottom, because it stands on the
    // ground. A hole does the opposite: the sun cannot reach the *upper* inner wall, and lands on the lower
    // one. So the shadow char must sit above the opening and the lit inner wall below it — an inversion a
    // future "tidy-up" pass would very plausibly undo, which is why it is a test and not a comment.
    const shadowTop = rowOf('d');
    const mouthTop = rowOf('k');
    const litInner = grid.findIndex((r, y) => y > mouthTop && r.includes('m'));
    expect(shadowTop).toBeLessThan(mouthTop);
    expect(litInner).toBeGreaterThan(mouthTop);
  });

  it('is machined, not dug — straight edges and square corners', () => {
    // Round is what animals make. The rim's top and bottom runs are unbroken horizontals of one char, which
    // no organic rig in this park has, and that is the silhouette cue doing the work at 32px.
    const top = grid.find((r) => r.includes('o'))!;
    expect(top.replace(/\./g, '')).toMatch(/^o+$/);
    expect(top.replace(/\./g, '').length).toBeGreaterThanOrEqual(10);
  });

  it('holds the darkest value in the park in its mouth', () => {
    // The opening is not a colour, it is an absence: nothing in it is lit.
    const values = Object.values(RIG.palette);
    expect(RIG.palette.k).toBe(Math.min(...values));
  });

  it('parks the shutter leaves either side of the mouth', () => {
    const seam = grid.findIndex((r) => r.includes('t'));
    expect(seam).toBeGreaterThan(-1);
    const row = grid[seam];
    expect(row.indexOf('t')).toBeLessThan(row.indexOf('k'));
    expect(row.lastIndexOf('t')).toBeGreaterThan(row.lastIndexOf('k'));
  });

  it('is a cool steel palette, not the park earth tones every other prop outlines in', () => {
    // Blue-shifted: for every colour, the blue channel is at least the red one. No dino-made prop in this
    // file can say that — they are all warm brown-olive outlines by house rule since cycle 296.
    for (const [ch, hex] of Object.entries(RIG.palette)) {
      const r = (hex >> 16) & 0xff;
      const b = hex & 0xff;
      expect(b, `${ch} is warm`).toBeGreaterThanOrEqual(r);
    }
  });

  it('closes the last undrawn prop key without closing the graceful path', () => {
    // Cycle 142-art moved the draw-a-rig-or-draw-nothing control off any real prop name and onto a name
    // nothing can ever claim, precisely so that finishing the roster could not quietly retire the fallback.
    // This is the night it would have: `hatch` was the last key in the park rendering as a glyph.
    expect(PROP_RIGS[NO_RIG_CONTROL]).toBeUndefined();
  });

  it('leaves the ground around it alone', () => {
    // Transparent corners: the plate is flush *in* the grass, so the grass shows at the corners rather than
    // the rig painting its own square of ground.
    expect(at(0, 0)).toBe('.');
    expect(at(15, 15)).toBe('.');
  });
});
