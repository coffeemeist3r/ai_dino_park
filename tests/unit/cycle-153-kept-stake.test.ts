/**
 * BACKLOG-518 (cycle 153-art) — the stake somebody keeps up.
 *
 * The fourth founder's-stake state, drawn the same night BACKLOG-535 finally gave it a number to hang off.
 * The tests below are family claims rather than a description of the picture: this rig has to read against
 * **two** siblings at once (it replaces the driven post and the set one), so what has to hold is that its
 * two tells are its own and that it is unmistakably the same object as the other three.
 */

import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from '../../game/src/art/propArt';

const KEPT = 'founder_stake_kept';
const FAMILY = ['founder_stake', 'founder_stake_native', 'founder_stake_hollowed', KEPT];

const count = (name: string, ch: string) =>
  PROP_RIGS[name].grid.reduce((n, row) => n + [...row].filter((c) => c === ch).length, 0);

describe('the kept stake is one of the family', () => {
  it('exists, and is a square 16-grid like its siblings', () => {
    expect(PROP_RIGS[KEPT]).toBeDefined();
    expect(PROP_RIGS[KEPT].size).toBe(16);
  });

  it('shares the family outline exactly — one object in four states, not four objects', () => {
    for (const n of FAMILY) expect(PROP_RIGS[n].palette.o).toBe(PROP_RIGS.founder_stake.palette.o);
  });

  it('keeps the driven post at full saturation, the opposite end of the axis from the bleached one', () => {
    expect(PROP_RIGS[KEPT].palette.w).toBe(PROP_RIGS.founder_stake.palette.w);
    expect(PROP_RIGS[KEPT].palette.w).not.toBe(PROP_RIGS.founder_stake_hollowed.palette.w);
  });

  it('is its own picture — no two states in the family share a grid', () => {
    const grids = FAMILY.map((n) => PROP_RIGS[n].grid.join('\n'));
    expect(new Set(grids).size).toBe(FAMILY.length);
  });
});

describe('the two tells, which are both traces of a recent visit', () => {
  it('carries more binding than any other state — the re-tie is the first read', () => {
    const kept = count(KEPT, 'b');
    expect(kept).toBeGreaterThan(count('founder_stake', 'b'));
    expect(kept).toBeGreaterThan(count('founder_stake_native', 'b'));
    expect(kept).toBeGreaterThan(count('founder_stake_hollowed', 'b'));
  });

  it('lays something at its foot, and it is food the park actually has', () => {
    // Not a matching literal: the offering *is* the berry body value, so a palette pass on the food set
    // moves both or fails here naming this item.
    expect(propCharsUsed(PROP_RIGS[KEPT].grid).has('f')).toBe(true);
    expect(PROP_RIGS[KEPT].palette.f).toBe(PROP_RIGS.food_berries.palette.r);
  });

  it('sets the offering to one side, so it reads as put down rather than built in', () => {
    // The post stands in columns 6–9 on every state in this family. Nothing of the offering is in them.
    const rows = PROP_RIGS[KEPT].grid;
    for (const row of rows) for (let x = 6; x <= 9; x++) expect(row[x]).not.toBe('f');
    expect(rows.some((row) => [...row].some((c, x) => c === 'f' && x > 9))).toBe(true);
  });

  it('borrows neither of the born-here tells, which are spoken for', () => {
    // 517 says *set, not driven* with laid stone and growth between it; a kept ground shows this mark
    // whichever way it was founded, so it cannot say its thing in 517's words.
    const used = propCharsUsed(PROP_RIGS[KEPT].grid);
    expect(used.has('s')).toBe(false); // laid stone (517)
    expect(used.has('g')).toBe(false); // growth (517 / 514)
  });
});
