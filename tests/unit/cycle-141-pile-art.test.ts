import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';
import { pileArtKey, type PileStep } from '../../game/src/world/bank';

/**
 * The bank's heap at three steps (BACKLOG-506, for BACKLOG-504).
 *
 * The generic prop suite (`cycle-066-propart`) already pins grid shape, palette size and non-emptiness for
 * every rig in the registry. What it cannot pin is the two things this set exists for, and both were what
 * the first draft got wrong: the steps have to be told apart **by silhouette from across a ground**, and the
 * heap has to read as *piled* rather than as the tidy stacked cairn sitting sixteen pixels away.
 */

const bbox = (grid: ReadonlyArray<string>) => {
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  grid.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }),
  );
  return { w: x1 - x0 + 1, h: y1 - y0 + 1, y0 };
};

const inked = (grid: ReadonlyArray<string>) => grid.join('').split('').filter((c) => c !== '.').length;

const STEPS: PileStep[] = [1, 2, 3];

describe("the ground's bank, drawn (BACKLOG-506)", () => {
  it('draws every step the bank can be in, and nothing for an empty ground', () => {
    for (const s of STEPS) expect(PROP_RIGS[pileArtKey(s)!], `step ${s}`).toBeDefined();
    expect(pileArtKey(0)).toBeNull();
    expect(PROP_RIGS.pile_0).toBeUndefined(); // step 0 is the bare ground, not a picture of one
  });

  /**
   * The item's actual requirement: a keeper standing on the ground can tell a full bank from a spent one
   * without opening the lens. Detail cannot do that at sixteen pixels — outline can.
   */
  it('grows in silhouette at every step, not just in detail', () => {
    const boxes = STEPS.map((s) => bbox(PROP_RIGS[pileArtKey(s)!].grid));
    for (let i = 1; i < boxes.length; i++) {
      expect(boxes[i].h, `step ${i + 1} is no taller than step ${i}`).toBeGreaterThan(boxes[i - 1].h);
      expect(boxes[i].w, `step ${i + 1} is no wider than step ${i}`).toBeGreaterThan(boxes[i - 1].w);
      expect(inked(PROP_RIGS[pileArtKey(STEPS[i])!].grid)).toBeGreaterThan(
        inked(PROP_RIGS[pileArtKey(STEPS[i - 1])!].grid),
      );
    }
  });

  it('is piled, not built — no step lines up into a level course the way the cairn does', () => {
    // The cairn's tell is a full-width outline row capping each tier. A heap has none: every row of the
    // heap's outline is broken by body pixels or transparency somewhere along it.
    for (const s of STEPS) {
      const grid = PROP_RIGS[pileArtKey(s)!].grid;
      const box = bbox(grid);
      const courses = grid.filter((row) => {
        const span = row.slice(0, 16).replace(/^\.+|\.+$/g, '');
        return span.length >= box.w && /^o+$/.test(span);
      });
      expect(courses, `step ${s} has a level course`).toEqual([]);
    }
  });

  it('says gathering rather than masonry at its fullest — the branch end in the heap', () => {
    const chars = propCharsUsed(PROP_RIGS.pile_3.grid);
    expect(chars.has('w')).toBe(true); // wood, and only here
    expect(propCharsUsed(PROP_RIGS.pile_1.grid).has('w')).toBe(false);
    expect(propCharsUsed(PROP_RIGS.pile_2.grid).has('w')).toBe(false);
  });

  it('keeps the park palette discipline', () => {
    for (const s of STEPS) {
      const rig = PROP_RIGS[pileArtKey(s)!];
      expect(Object.keys(rig.palette).length).toBeLessThanOrEqual(8);
      expect(propCharsUsed(rig.grid).size).toBeLessThanOrEqual(Object.keys(rig.palette).length);
    }
  });
});
