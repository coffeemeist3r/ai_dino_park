import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from '../../game/src/art/propArt';

/**
 * The stake of a ground nobody walked to (BACKLOG-517).
 *
 * `cycle-144-founder-stake.test.ts` pins the 513/514 pair as one object in two states. This adds the third,
 * and it is pinned the same way and for the same reason: every distinguishing mark below is a thing a
 * well-meaning tidy-up pass would plausibly undo, after which the park still draws three stakes and the
 * player can no longer tell a ground somebody was born on from a ground somebody walked into — which is
 * BACKLOG-516's whole point, rendered.
 */

const DRIVEN = PROP_RIGS.founder_stake; // 513 — carried here and hammered in
const SET = PROP_RIGS.founder_stake_native; // 517 — set in laid stone, and never carried anywhere
const LEFT = PROP_RIGS.founder_stake_hollowed; // 514 — and then everybody went

const count = (grid: ReadonlyArray<string>, ch: string) =>
  grid.reduce((n, r) => n + [...r].filter((c) => c === ch).length, 0);

const postColumns = (grid: ReadonlyArray<string>) =>
  grid.map((r) => r.indexOf('w')).filter((i) => i >= 0);

const saturation = (hex: number) => {
  const [r, g, b] = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
};

describe('the third state is the same object (BACKLOG-517)', () => {
  it('is registered, square, and the same size as its two siblings', () => {
    expect(SET).toBeDefined();
    expect(SET.size).toBe(16);
    expect(SET.grid).toHaveLength(16);
    for (const row of SET.grid) expect(row).toHaveLength(16);
  });

  it('shares an outline with both siblings — one object in three states, not three objects', () => {
    expect(SET.palette.o).toBe(DRIVEN.palette.o);
    expect(SET.palette.o).toBe(LEFT.palette.o);
  });

  it('keeps the driven post’s wood — this ground is being kept, not left', () => {
    expect(SET.palette.w).toBe(DRIVEN.palette.w);
    // and is emphatically not the bleached variant: 514's whole tell is the colour going out.
    expect(saturation(SET.palette.w)).toBeGreaterThan(saturation(LEFT.palette.w) * 2);
  });

  it('stands straight — a set post does not lean, which is what separates it from 514', () => {
    const cols = postColumns(SET.grid);
    expect(new Set(cols).size).toBe(1);
    expect(new Set(postColumns(LEFT.grid)).size).toBeGreaterThan(1);
  });

  it('keeps its binding tight — the same cord showing as the driven post', () => {
    expect(count(SET.grid, 'b')).toBe(count(DRIVEN.grid, 'b'));
    expect(count(SET.grid, 'b')).toBeGreaterThan(count(LEFT.grid, 'b'));
  });
});

describe('what makes it born-here rather than driven', () => {
  it('is set in laid stone, which the driven post has none of', () => {
    expect(count(SET.grid, 's')).toBeGreaterThan(0);
    expect(count(DRIVEN.grid, 's')).toBe(0);
  });

  it('keeps the stone at the base, where ground is', () => {
    const rowsWithStone = SET.grid.map((r, i) => (r.includes('s') ? i : -1)).filter((i) => i >= 0);
    for (const i of rowsWithStone) expect(i).toBeGreaterThanOrEqual(SET.grid.length - 4);
  });

  it('has something growing between the stones — a new stake cannot', () => {
    expect(count(SET.grid, 'g')).toBeGreaterThan(0);
    expect(count(DRIVEN.grid, 'g')).toBe(0);
    // Living green, not 514's creep swallowing an abandoned shaft.
    expect(saturation(SET.palette.g)).toBeGreaterThan(saturation(LEFT.palette.g));
  });

  it('keeps GBA palette discipline', () => {
    expect(Object.keys(SET.palette).length).toBeLessThanOrEqual(8);
  });

  it('is not the driven post with a hat on — the grids actually differ', () => {
    expect(SET.grid.join('\n')).not.toBe(DRIVEN.grid.join('\n'));
  });
});
