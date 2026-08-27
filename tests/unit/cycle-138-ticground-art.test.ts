import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

/**
 * The ritual's little path (BACKLOG-496) — two of the three worn-ground rigs.
 *
 * The generic prop suite (`cycle-066-propart`) already pins grid shape, palette size and non-emptiness for
 * every rig in the registry. What it cannot pin is whether the picture is of the *right thing*, which is
 * where both of this pair's first drafts went wrong: a scuff drawn as one long oval is a shadow, and a
 * trodden circle drawn as a filled disc is just a bigger scuff. Each rig's distinguishing feature is
 * asserted here rather than trusted.
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
  return { w: x1 - x0 + 1, h: y1 - y0 + 1, x0, x1, y0, y1 };
};

/** Runs of bare earth on one row, as [start, end] pairs. */
const earthRuns = (row: string) => [...row.matchAll(/[ed]+/g)].map((m) => [m.index!, m.index! + m[0].length - 1]);

describe("the ritual's worn ground (BACKLOG-496)", () => {
  it('draws all three ritual kinds — 496 closed cycle 142-art', () => {
    // For four cycles the third line here read `toBeUndefined()`: `fuss` was held back on purpose as the
    // per-kind fallback control, and cycle 138-art drew two of three so the control would stay *exercised*
    // rather than merely asserted. Cycle 142 gave the marks a host in the world (507) and the Artist closed
    // the item the same night. The control for the draw-a-rig-or-draw-nothing branch has moved to the one
    // prop key still undrawn — the feeding hatch, BACKLOG-502.
    expect(PROP_RIGS.tic_pace).toBeDefined();
    expect(PROP_RIGS.tic_circle).toBeDefined();
    expect(PROP_RIGS.tic_fuss).toBeDefined();
  });

  it('neither mark carries a near-black outline — a worn patch is not a hole in the world', () => {
    for (const key of ['tic_pace', 'tic_circle', 'tic_fuss']) {
      for (const color of Object.values(PROP_RIGS[key].palette)) {
        const [r, g, b] = [(color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff];
        expect(r + g + b).toBeGreaterThan(120); // every prop outline in this file sits well below this
      }
    }
  });

  it('the three rigs speak one worn-ground language — the same earth and the same trodden edge', () => {
    for (const key of ['tic_circle', 'tic_fuss']) {
      expect(PROP_RIGS[key].palette.s).toBe(PROP_RIGS.tic_pace.palette.s);
      expect(PROP_RIGS[key].palette.e).toBe(PROP_RIGS.tic_pace.palette.e);
    }
  });

  describe('fuss — the turned-over patch (cycle 142-art)', () => {
    const rig = PROP_RIGS.tic_fuss;

    it('is one clump, not two: no row carries two separate runs of earth', () => {
      // That property is `pace`'s whole tell, and the first draft of this rig was a small scuff, which at
      // sixteen pixels is the same picture. These two assertions are what separate them.
      for (const row of rig.grid) expect(earthRuns(row).length).toBeLessThanOrEqual(1);
    });

    it('has no hole: the middle is turned over, which is what `circle` leaves standing', () => {
      const b = bbox(rig.grid);
      const mid = rig.grid[Math.floor((b.y0 + b.y1) / 2)];
      expect(mid[Math.floor((b.x0 + b.x1) / 2)]).toMatch(/[ed]/);
    });

    it('is roughly square and smaller than either of the others — a spot, not a route', () => {
      const b = bbox(rig.grid);
      expect(Math.abs(b.w - b.h)).toBeLessThanOrEqual(3);
      expect(b.w).toBeLessThan(bbox(PROP_RIGS.tic_pace.grid).w);
    });

    it('scatters its clods rather than outlining them — the churn is inside the shape', () => {
      const deep = rig.grid.reduce((n, row) => n + [...row].filter((c) => c === 'd').length, 0);
      expect(deep).toBeGreaterThan(2);
    });
  });

  describe('pace — the two-tile scuff', () => {
    const rig = PROP_RIGS.tic_pace;

    it('is a path, not a patch: wider than it is tall', () => {
      const b = bbox(rig.grid);
      expect(b.w).toBeGreaterThan(b.h);
    });

    it('wears bare at two separate ends, joined by ground that is only trodden', () => {
      const rows = rig.grid.filter((r) => earthRuns(r).length > 0);
      expect(rows.length).toBeGreaterThan(0);
      // At least one row shows the shape outright: two disjoint bare runs...
      const split = rows.filter((r) => earthRuns(r).length === 2);
      expect(split.length).toBeGreaterThan(0);
      // ...and the ground between them is trodden rather than bare, which is what makes it a track.
      const middle = rig.grid.find((r) => r.includes('t'));
      expect(middle).toBeDefined();
      const runs = earthRuns(middle!);
      expect(runs.length).toBe(2);
      expect(middle!.slice(runs[0][1] + 1, runs[1][0])).toMatch(/^t+$/);
    });
  });

  describe('circle — the trodden ring', () => {
    const rig = PROP_RIGS.tic_circle;

    it('is a ring, not a disc: the middle is untouched', () => {
      const b = bbox(rig.grid);
      const cx = Math.floor((b.x0 + b.x1) / 2);
      const cy = Math.floor((b.y0 + b.y1) / 2);
      for (const y of [cy, cy + 1]) for (const x of [cx, cx + 1]) expect(rig.grid[y][x]).toBe('.');
    });

    it('is worn all the way round — every ring row has two sides to it', () => {
      const rows = rig.grid.filter((r) => r.includes('e'));
      expect(rows.length).toBeGreaterThanOrEqual(6);
      const holed = rows.filter((r) => earthRuns(r).length === 2);
      expect(holed.length).toBeGreaterThanOrEqual(rows.length - 4); // the top and bottom caps are solid
    });

    it('is about as wide as it is tall — a turn on the spot, not a walk', () => {
      const b = bbox(rig.grid);
      expect(Math.abs(b.w - b.h)).toBeLessThanOrEqual(1);
    });
  });
});
