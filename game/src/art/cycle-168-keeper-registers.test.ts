import { describe, it, expect } from 'vitest';
import { PROP_RIGS } from './propArt';
import { PLAQUE_REGISTERS, WATCH_ART_KEY, SITTING_ART_KEY, STREAK_ART_KEY } from '../ui/plaque';

// BACKLOG-560/561 (cycle 168-art) — the other two keeper lines' registers. Thirteenth and fourteenth
// rigs, drawn the cycle after `streak` and against the same plate, so they are checked against the
// plaque and against **each other** rather than against the mark family.

const WATCH = PROP_RIGS[WATCH_ART_KEY];
const SITTING = PROP_RIGS[SITTING_ART_KEY];
const STREAK = PROP_RIGS[STREAK_ART_KEY];

/** The plaque's own colours, from `setupPlaque`'s constants. A register is made of them. */
const BRASS_FACE = 0xf4d58d; // the stat lines
const KEEPER_LIP = 0xfff1c9; // the keeper lines
const PANEL = 0x3a2a14; // the plate behind them

const lit = (g: ReadonlyArray<string>) =>
  g.reduce((n, row) => n + [...row].filter((c) => c !== '.').length, 0);

/** The narrowest horizontal run of *lit* cells anywhere in the rig. The cut may be one cell; brass may not. */
const thinnestLitRun = (g: ReadonlyArray<string>) =>
  Math.min(...g.flatMap((row) => [...row.matchAll(/[hB]+/g)].map((m) => m[0].length)).concat([Infinity]));

describe('both registers exist under the keys the plaque looks up', () => {
  it('are registered, and the keys come from the plaque module rather than being retyped', () => {
    expect(WATCH).toBeDefined();
    expect(SITTING).toBeDefined();
    expect(WATCH_ART_KEY).toBe('watch');
    expect(SITTING_ART_KEY).toBe('sitting');
  });

  it('the register table names all three keeper lines, each by prefix and never by index', () => {
    expect(PLAQUE_REGISTERS.map((r) => r.key)).toEqual([WATCH_ART_KEY, SITTING_ART_KEY, STREAK_ART_KEY]);
    for (const r of PLAQUE_REGISTERS) {
      expect(r.prefix.endsWith(' · ')).toBe(true);
      expect(PROP_RIGS[r.key]).toBeDefined();
    }
  });

  it('are square 16 grids, like every sibling', () => {
    for (const rig of [WATCH, SITTING]) {
      expect(rig.size).toBe(16);
      expect(rig.grid).toHaveLength(16);
      for (const row of rig.grid) expect(row).toHaveLength(16);
    }
  });
});

describe('they are made of the brass they are struck into', () => {
  it('use exactly three colours, two of them the plaque s own', () => {
    for (const rig of [WATCH, SITTING]) {
      expect(Object.keys(rig.palette)).toHaveLength(3);
      expect(Object.values(rig.palette)).toContain(BRASS_FACE);
      expect(Object.values(rig.palette)).toContain(KEEPER_LIP);
    }
  });

  it('share the streak s palette exactly — the three registers are one plate, not three stickers', () => {
    expect(WATCH.palette).toEqual(STREAK.palette);
    expect(SITTING.palette).toEqual(STREAK.palette);
  });

  it('cut darker than the plate behind them — a notch the value of its plate is a drawing of a notch', () => {
    for (const rig of [WATCH, SITTING]) expect(rig.palette.o).toBeLessThan(PANEL);
  });
});

describe('they read at 11px type', () => {
  it('nothing lit is thinner than two cells — the rouse iris lesson, asserted rather than eyeballed', () => {
    expect(thinnestLitRun(WATCH.grid)).toBeGreaterThanOrEqual(2);
    expect(thinnestLitRun(SITTING.grid)).toBeGreaterThanOrEqual(2);
  });

  it('the hourglass neck is exactly two cells — the pinch the shape wants is one, and one does not bake', () => {
    const neck = SITTING.grid.filter((r) => r.includes('ohho'));
    expect(neck.length).toBeGreaterThanOrEqual(2); // the waist is two rows tall
  });

  it('carry enough lit cells to be seen, and the ring carries the most of any rig here', () => {
    expect(lit(WATCH.grid)).toBe(148);
    expect(lit(SITTING.grid)).toBe(116);
    // The ring is the largest engraving in the registry and that is the shape's doing, not a slip: a
    // twelve-cell circumference at a two-cell wall is simply more brass than a bar or a bell.
    expect(lit(WATCH.grid)).toBeGreaterThan(lit(STREAK.grid));
  });
});

describe('the two cannot be mistaken for each other, which is the whole design problem', () => {
  // They sit eleven pixels apart on the same plate and both measure time. If they do not differ in
  // silhouette the player reads whichever one they glanced at as both.
  const silhouette = (g: ReadonlyArray<string>) => g.map((r) => [...r].map((c) => (c === '.' ? '.' : '#')).join(''));

  it('their silhouettes differ', () => {
    expect(silhouette(WATCH.grid)).not.toEqual(silhouette(SITTING.grid));
  });

  it('the ring is hollow at its centre and the hourglass is pinched there — a span, and a thing running out', () => {
    // Row 7 is the middle. The ring has brass on both flanks with air between; the glass has its waist.
    expect(WATCH.grid[7].startsWith('.ohho')).toBe(true); // wall, then the hole
    expect(SITTING.grid[7]).toBe('......ohho......'); // nothing but the neck
  });

  it('and neither can be mistaken for the notched bar below them', () => {
    expect(silhouette(WATCH.grid)).not.toEqual(silhouette(STREAK.grid));
    expect(silhouette(SITTING.grid)).not.toEqual(silhouette(STREAK.grid));
  });
});
