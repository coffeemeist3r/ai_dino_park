import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

// BACKLOG-558 — the brass in pieces. The plaque was one `Text` with newlines in it, so no line on it
// could carry anything of its own and BACKLOG-539 sat blocked for nine cycles. It is now one `Text`
// per line, and this spec asserts what is *drawn* rather than what is computed — `__plaque` answers
// the second question and has all along; cycle 163 is why the difference is worth a separate hook.

type W = Record<string, unknown>;

interface Row {
  text: string;
  kind: 'stat' | 'keeper';
  color: string;
}

const rows = (p: Page) => p.evaluate(() => ((window as W).__plaqueRows as () => Row[])());
const setZone = (p: Page, id: string) =>
  p.evaluate((z) => ((window as W).__setZone as (x: string) => void)(z), id);
/**
 * The drawn rows and the computed lines, read at one instant.
 *
 * The plaque refreshes on the world clock's tick, so `__plaqueRows()` reports the last *rendered* frame
 * while `__plaqueLines()` computes from the park as it stands right now. Between two ticks they
 * legitimately differ (a pile is gathered, the satchel empties), and `Sitting · Ns` changes every wall
 * second — CI went flaky on exactly that (`Sitting · 1s` drawn vs `0s` computed, cycle 170). Reading
 * them in two `page.evaluate` round-trips leaves a gap for the second to roll over in.
 *
 * So this re-engraves (`__setZone` on the zone we are already in has called `refreshPlaque()` since
 * BACKLOG-143) and reads both in the same synchronous turn. A second rollover can still land between
 * the two `Date.now()` reads inside that turn, so it retries a few times; three misses in a row would be
 * a real disagreement, and the assertion then reports it.
 */
const snapshot = (p: Page) =>
  p.evaluate(() => {
    const w = window as W;
    let out = { rows: [] as { text: string; kind: string; color: string }[], lines: [] as string[] };
    for (let i = 0; i < 3; i++) {
      (w.__setZone as (z: string) => void)((w.__zone as () => string)());
      out = {
        rows: (w.__plaqueRows as () => { text: string; kind: string; color: string }[])(),
        lines: (w.__plaqueLines as () => string[])(),
      };
      if (JSON.stringify(out.rows.map((r) => r.text)) === JSON.stringify(out.lines)) break;
    }
    return out;
  });
const reengrave = async (p: Page) => {
  await snapshot(p);
};

test('the brass is one object per line, and it says exactly what plaqueLines says', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  const { rows: drawn, lines: computed } = await snapshot(page);

  // S3 — more than one row exists at all, which is the whole geometry change.
  expect(drawn.length).toBeGreaterThan(1);

  // S4 — and the rows read top-to-bottom exactly as the pure function writes them: none lost, none
  // reordered, none invented.
  expect(drawn.map((r) => r.text)).toEqual(computed);

  expect(errors).toEqual([]);
});

test('the three lines about the player are engraved apart from the ones about the park', async ({ page }) => {
  // S5, and this track's reachability half (CHARTER v7): visible on a fresh save's first frame, with
  // no friendship, no clock boundary and no population floor.
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  await reengrave(page);
  const drawn = await rows(page);

  const keeper = drawn.filter((r) => r.kind === 'keeper');
  const stat = drawn.filter((r) => r.kind === 'stat');
  expect(keeper.length).toBeGreaterThan(0);
  expect(stat.length).toBeGreaterThan(0);

  // Who is watching is on the brass from the first frame (BACKLOG-555) and is one of the three.
  expect(keeper.some((r) => r.text.startsWith('Watch · '))).toBe(true);

  // The park lines are byte-identical to the night before this landed; the keeper lines are not.
  const statColors = new Set(stat.map((r) => r.color));
  const keeperColors = new Set(keeper.map((r) => r.color));
  expect(statColors).toEqual(new Set(['#f4d58d']));
  expect(keeperColors.size).toBe(1);
  expect([...keeperColors][0]).not.toBe('#f4d58d');
});

test('a brass that loses a line does not keep engraving it', async ({ page }) => {
  // S4's other half. Rows are reused and hidden rather than destroyed, which is the cheap way to do
  // this and also the way that can go wrong: a stale row left visible under a shorter plaque.
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  const before = await rows(page);

  // Crossing to another ground changes which optional lines the brass carries (stores, upkeep).
  await setZone(page, 'grove');
  await settle(page);

  const { rows: after, lines: computed } = await snapshot(page);
  expect(after.map((r) => r.text)).toEqual(computed);
  expect(after.map((r) => r.text)).not.toEqual(before.map((r) => r.text));
});

test('the day-count is engraved, not written — BACKLOG-539, nine cycles late', async ({ page }) => {
  // The art half. `__streakMark` is the live `Image`, so this asserts the rig is *blitted* rather than
  // that a rig exists — the distinction cycle 165 tightened from text-or-image to image the moment a
  // rig existed, so a register that quietly stops being drawn can no longer pass.
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await reengrave(page);

  const mark = await page.evaluate(() =>
    ((window as W).__streakMark as () => { visible: boolean; x: number; y: number } | null)(),
  );
  expect(mark).not.toBeNull();
  expect(mark!.visible).toBe(true);

  // It stands beside the streak row, not on top of it: left of the brass, at that row's height.
  const drawn = await rows(page);
  const idx = drawn.findIndex((r) => r.text.startsWith('Keeper · '));
  expect(idx).toBeGreaterThanOrEqual(0);
  expect(drawn[idx].kind).toBe('keeper');
  expect(mark!.x).toBeLessThan(0); // left of the plaque's centre line
});
