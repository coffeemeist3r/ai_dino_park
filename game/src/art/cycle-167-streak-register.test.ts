import { describe, it, expect } from 'vitest';
import { PROP_RIGS, propCharsUsed } from './propArt';
import { STREAK_ART_KEY } from '../ui/plaque';

// BACKLOG-539 (cycle 167-art) — the day-count's engraved register. The twelfth rig and the first that
// is not a mark: it is struck into the plaque's brass beside the one line about the player, so it is
// checked against the plaque rather than against the mark family.

const RIG = PROP_RIGS[STREAK_ART_KEY];

/** The plaque's own two colours, from `setupPlaque`'s constants. The register is made of them. */
const BRASS_FACE = 0xf4d58d; // the stat lines
const KEEPER_LIP = 0xfff1c9; // the keeper lines
const PANEL = 0x3a2a14; // the plate behind it

const lit = (g: ReadonlyArray<string>) =>
  g.reduce((n, row) => n + [...row].filter((c) => c !== '.').length, 0);

describe('the register exists at all', () => {
  it('is registered under the key the plaque looks up', () => {
    expect(RIG).toBeDefined();
    expect(STREAK_ART_KEY).toBe('streak');
  });

  it('is a square 16 grid, like every sibling', () => {
    expect(RIG.size).toBe(16);
    expect(RIG.grid).toHaveLength(16);
    for (const row of RIG.grid) expect(row).toHaveLength(16);
  });
});

describe('it is made of the brass it is struck into', () => {
  it('uses exactly three colours, and two of them are the plaque s own', () => {
    expect(Object.keys(RIG.palette)).toHaveLength(3);
    expect(Object.values(RIG.palette)).toContain(BRASS_FACE);
    expect(Object.values(RIG.palette)).toContain(KEEPER_LIP);
  });

  it('cuts darker than the plate behind it — a notch the value of its plate is a drawing of a notch', () => {
    const cut = RIG.palette.o;
    expect(cut).toBeLessThan(PANEL);
    // and darker than both brass tones, so the rim reads as depth from any angle
    expect(cut).toBeLessThan(BRASS_FACE);
    expect(cut).toBeLessThan(KEEPER_LIP);
  });

  it('declares no character it does not draw, and draws none it has not declared', () => {
    expect(propCharsUsed(RIG.grid)).toEqual(new Set(Object.keys(RIG.palette)));
  });
});

describe('the silhouette is a tally stick, and survives the plaque s 11px', () => {
  it('is a bar down the left with teeth struck out to the right, not a blob', () => {
    // The bar occupies the same columns on every lit row; the teeth reach further right on some.
    const reach = RIG.grid.map((r) => r.replace(/\.+$/, '').length).filter((n) => n > 0);
    const bar = Math.min(...reach);
    const tooth = Math.max(...reach);
    expect(tooth).toBeGreaterThan(bar);
    // and it is genuinely tall and thin: nothing reaches past two-thirds of the grid
    expect(tooth).toBeLessThanOrEqual(11);
  });

  it('strikes three teeth, evenly spaced — not four, and not the five-bar gate', () => {
    const toothRows = RIG.grid
      .map((r, i) => ({ i, w: r.replace(/\.+$/, '').length }))
      .filter((r) => r.w > 8)
      .map((r) => r.i);
    // three teeth, three rows each (top rim, body, bottom rim)
    expect(toothRows).toHaveLength(9);
    const gaps = [toothRows[2], toothRows[5]].map((v, n) => toothRows[3 + n * 3] - v);
    expect(new Set(gaps).size).toBe(1); // evenly spaced
  });

  it('is nowhere thinner than two cells, which is why it reads where the gate did not', () => {
    // The lit bar is four columns wide on every plain row (rim, lip, face, face, rim = 5 incl. rims).
    const plain = RIG.grid.filter((r) => r.replace(/\.+$/, '').length === 8);
    expect(plain.length).toBeGreaterThan(0);
    for (const row of plain) expect([...row].filter((c) => c !== '.').length).toBe(5);
  });
});

describe('weight, claimed against the family rather than asserted alone', () => {
  it('sits high in the family but under its heaviest, at 102 cells', () => {
    // Per the cycle-155 correction: a lit-cell count means nothing except against its siblings, so it is
    // claimed against all of them rather than stated alone. 102 puts it above `sulk` (94, the heaviest
    // posture) and below `rouse` (110, the heaviest mark) — which is the right place for it. It is a
    // solid engraved object rather than a floating glyph, and it is read at rest on a panel instead of
    // at a glance over a moving animal, so it carries more than a mood does; but it sits in chrome the
    // eye passes over constantly, so it must not be the loudest thing the registry contains.
    const mine = lit(RIG.grid);
    expect(mine).toBe(102);
    const marks = ['doze', 'rouse', 'vigil', 'missed', 'mend', 'glance', 'mope', 'sulk']
      .filter((k) => PROP_RIGS[k])
      .map((k) => lit(PROP_RIGS[k].grid));
    expect(marks.length).toBe(8);
    expect(mine).toBeGreaterThan(lit(PROP_RIGS.sulk.grid));
    expect(mine).toBeLessThan(Math.max(...marks));
  });
});
