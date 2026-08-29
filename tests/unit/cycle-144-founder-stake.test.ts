import { describe, it, expect } from 'vitest';
import { PROP_RIGS, NO_RIG_CONTROL } from '../../game/src/art/propArt';

/**
 * The founder's stake and the stake that outlived its ground (BACKLOG-513 / 514).
 *
 * `cycle-066-propart` already pins grid shape, palette size and non-emptiness for every rig in the
 * registry. What it cannot pin is the thing this *pair* exists to be: one object in two states, where the
 * difference between the states is the entire read. If the hollowed variant stops leaning, or its binding
 * tightens, or the colour comes back into its wood, the park still draws two stakes and the player can no
 * longer tell a ground somebody founded from a ground everybody left — which is BACKLOG-512's whole point,
 * rendered.
 *
 * Every claim below is a thing a well-meaning tidy-up pass would plausibly undo.
 */

const UP = PROP_RIGS.founder_stake;
const OUT = PROP_RIGS.founder_stake_hollowed;

/** The column of the post in each row that shows one, top to bottom. */
const postColumns = (grid: ReadonlyArray<string>) =>
  grid.map((r) => r.indexOf('w')).filter((i) => i >= 0);

const count = (grid: ReadonlyArray<string>, ch: string) =>
  grid.reduce((n, r) => n + [...r].filter((c) => c === ch).length, 0);

/** 0 (grey) .. 1 (fully saturated) — the "colour has gone out of it" measure, as a number. */
const saturation = (hex: number) => {
  const [r, g, b] = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
  const max = Math.max(r, g, b);
  return max === 0 ? 0 : (max - Math.min(r, g, b)) / max;
};

describe('both stakes exist and are one object (BACKLOG-513 / 514)', () => {
  it('are registered under the keys the pair is looked up by', () => {
    expect(UP).toBeDefined();
    expect(OUT).toBeDefined();
    expect(UP.size).toBe(16);
    expect(OUT.size).toBe(16);
  });

  it('share an outline — two states of one object, not two objects', () => {
    expect(OUT.palette.o).toBe(UP.palette.o);
  });

  it('leaves the no-rig control alone (the fallback stays exercised)', () => {
    expect(NO_RIG_CONTROL in PROP_RIGS).toBe(false);
  });
});

describe('the founder\'s stake is driven, and it is a sign (BACKLOG-513)', () => {
  it('stands perfectly vertical — every post row uses the same column', () => {
    // "Driven" is the word the item uses and this is the only thing that carries it at 32px. A post that
    // wanders a column reads as a stick somebody leaned there, which is the *other* rig.
    expect(new Set(postColumns(UP.grid)).size).toBe(1);
  });

  it('carries a cross-piece, which is what makes it a mark rather than a branch', () => {
    // The park already has a branch rig. A stake that is only a post is that rig rotated; the second axis
    // is the whole difference, so it has to be wide enough to read as one.
    const bar = UP.grid.find((r) => r.includes('C'))!;
    expect([...bar].filter((c) => c === 'C').length).toBeGreaterThanOrEqual(6);
  });

  it('is bound at the crossing — somebody tied this', () => {
    const bound = UP.grid.filter((r) => r.includes('b'));
    expect(bound.length).toBeGreaterThanOrEqual(3);
    // The binding sits where the two axes meet, not off to one side.
    for (const row of bound) expect(row.indexOf('b')).toBe(UP.grid[2].indexOf('w') - 1);
  });

  it('is fresh wood — nothing has grown on it', () => {
    expect(UP.palette.g).toBeUndefined();
  });
});

describe('the stake that outlived its ground (BACKLOG-514)', () => {
  it('leans, and the lean travels — the top is columns away from the base', () => {
    // The first draft drew the post crooked in place, which reads as a badly-drawn upright. A lean is a
    // diagonal the eye follows: the top of the post must sit several columns off its base.
    const cols = postColumns(OUT.grid);
    expect(cols[0] - cols[cols.length - 1]).toBeGreaterThanOrEqual(3);
  });

  it('leans one way only — a post that wanders back is a wobble, not a lean', () => {
    const cols = postColumns(OUT.grid);
    for (let i = 1; i < cols.length; i++) expect(cols[i]).toBeLessThanOrEqual(cols[i - 1]);
  });

  it('has slack binding — markedly less cord showing than its upright twin', () => {
    expect(count(OUT.grid, 'b')).toBeLessThan(count(UP.grid, 'b'));
  });

  it('has the colour gone out of its wood, at the same brightness', () => {
    // Not "darker" — a hollowed ground is not a night scene. Desaturated: the same value, none of the hue.
    expect(saturation(OUT.palette.w)).toBeLessThan(saturation(UP.palette.w) / 2);
  });

  it('has the ground climbing it, and only at the foot', () => {
    const creep = OUT.grid.map((r, y) => (r.includes('g') ? y : -1)).filter((y) => y >= 0);
    expect(creep.length).toBeGreaterThan(0);
    for (const y of creep) expect(y).toBeGreaterThanOrEqual(Math.floor((OUT.size * 2) / 3));
  });

  it('grows the only green in either rig', () => {
    const g = OUT.palette.g;
    const [r, gr, b] = [(g >> 16) & 255, (g >> 8) & 255, g & 255];
    expect(gr).toBeGreaterThan(r);
    expect(gr).toBeGreaterThan(b);
    for (const [key, hex] of Object.entries({ ...UP.palette, ...OUT.palette })) {
      if (key === 'g') continue;
      const [rr, gg, bb] = [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
      expect(gg > rr && gg > bb, `${key} should not be green`).toBe(false);
    }
  });
});
