import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from './propArt';
import { ROUSE_ART_KEY } from '../world/chronotype';
import { VIGIL_ART_KEY } from '../world/vigil';
import { MISSED_ALOOF_ART_KEY, MISSED_ART_KEY } from '../world/missed';

const rouse = PROP_RIGS[ROUSE_ART_KEY];
const vigil = PROP_RIGS[VIGIL_ART_KEY];
const missed = PROP_RIGS[MISSED_ART_KEY];
const aloof = PROP_RIGS[MISSED_ALOOF_ART_KEY];

const cells = (r: typeof aloof) => r.grid.join('').split('').filter((c) => c !== '.');
const runs = (row: string) => row.split('.').filter((s) => s.length > 0);
const width = (row: string) => row.replace(/\./g, '').length;

describe('BACKLOG-534 — the aloof mark is well formed', () => {
  it('is a square 16px grid whose palette is exactly what it inks', () => {
    expect(aloof).toBeDefined();
    expect(aloof.size).toBe(16);
    expect(aloof.grid).toHaveLength(16);
    for (const row of aloof.grid) expect(row).toHaveLength(16);
    const keys = Object.keys(aloof.palette);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.length).toBeLessThanOrEqual(8);
    expect(new Set(cells(aloof))).toEqual(new Set(keys));
  });
});

describe('BACKLOG-534 — it is the same family and not the same rig', () => {
  it('shares the outline and the sclera with the lit mark, verbatim', () => {
    expect(aloof.palette.o).toBe(missed.palette.o);
    expect(aloof.palette.W).toBe(missed.palette.W);
    expect(aloof.palette.o).toBe(rouse.palette.o);
  });

  it('carries no catchlight at all — the one mark in the park entitled to none', () => {
    expect(aloof.palette.c).toBeUndefined();
    expect(missed.palette.c).toBeDefined(); // the thing it is defined against
    expect(vigil.palette.c).toBeDefined();
  });

  /**
   * The failure this item was opened over, asserted so it cannot come back. The `aloof` grade used to be
   * the lit rig at `MISSED_FAINT_ALPHA`, which is the same silhouette at lower opacity — and cycle 151's
   * beacon settled that dim reads as *far away* rather than *withheld*. A rig that differs only in palette
   * is that failure re-drawn by hand.
   */
  it('is not the lit mark dimmed — the silhouette itself differs', () => {
    expect(aloof.grid).not.toEqual(missed.grid);
    expect(cells(aloof).length).toBe(cells(missed).length / 2);
  });

  it('is the lightest thing in the park, which is what a withheld half should be', () => {
    for (const other of [missed, vigil, rouse]) {
      expect(cells(aloof).length).toBeLessThan(cells(other).length);
    }
  });
});

describe('BACKLOG-534 — the three reads, at 32px', () => {
  it('is hollow: every row of the puff wall is two runs, not one', () => {
    // The lit mark is a single filled body (its own spec asserts at most one run per row). This one is an
    // outline, so the middle of the puff is open — a thought you can see the shape of and nothing inside.
    // The wall rows are the ones the outline colour inks below full width.
    const wall = aloof.grid.filter((r) => r.includes('o') && width(r) < 6);
    expect(wall.length).toBeGreaterThan(0);
    for (const row of wall) expect(runs(row).length).toBe(2);
  });

  it('turns its tail the other way — away from the dino, not back toward it', () => {
    /** The leftmost inked column of the tail's topmost and bottommost rows. */
    const tail = (rig: typeof aloof, ink: RegExp) => {
      const rows = rig.grid.map((r, y) => ({ y, r })).filter(({ r }) => ink.test(r) && width(r) <= 2);
      const top = rows[0];
      const bottom = rows[rows.length - 1];
      expect(rows.length).toBeGreaterThan(1);
      return { top: top.r.search(/[^.]/), bottom: bottom.r.search(/[^.]/) };
    };
    // Below the puff, `missed`'s dots step *left* as they descend — the thought trails back toward the dino
    // having it. This one's step *right*: the thought is turned aside.
    const lit = tail(missed, /o/);
    const held = tail(aloof, /W/);
    expect(lit.bottom).toBeLessThan(lit.top);
    expect(held.bottom).toBeGreaterThan(held.top);
  });

  it('leans off the vertical — the upper half does not sit over the lower', () => {
    const inked = aloof.grid.map((r, y) => ({ y, left: r.search(/[^.]/) })).filter((r) => r.left >= 0);
    const upper = inked.filter((r) => r.y < 8).map((r) => r.left);
    // `missed` is square about its puff; this one is not, and the cant is what makes it read as turned away.
    const mirrored = aloof.grid.map((r) => [...r].reverse().join(''));
    expect(mirrored).not.toEqual([...aloof.grid]);
    expect(new Set(upper).size).toBeGreaterThan(1);
  });

  it('leaves the two trailing dots as the only solid pixels', () => {
    const solid = aloof.grid.join('').split('').filter((c) => c === 'W');
    expect(solid).toHaveLength(8); // two dots, 2x2 each
    // ...and they are all below the body, so the read is a thought rising into an empty shape.
    const wRows = aloof.grid.map((r, y) => ({ y, has: r.includes('W') })).filter((r) => r.has).map((r) => r.y);
    const oRows = aloof.grid.map((r, y) => ({ y, has: r.includes('o') })).filter((r) => r.has).map((r) => r.y);
    expect(Math.min(...wRows)).toBeGreaterThan(Math.max(...oRows));
  });
});
