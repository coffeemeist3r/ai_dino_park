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
const lines = (p: Page) => p.evaluate(() => ((window as W).__plaqueLines as () => string[])());
const setZone = (p: Page, id: string) =>
  p.evaluate((z) => ((window as W).__setZone as (x: string) => void)(z), id);
/**
 * Re-engrave the brass on demand, through the hook that already does it.
 *
 * The plaque refreshes on the world clock's tick, so `__plaqueRows()` reports the last *rendered*
 * frame while `__plaqueLines()` computes from the park as it stands right now — and between two ticks
 * those legitimately differ (a pile is gathered, the satchel empties). `__setZone` has called
 * `refreshPlaque()` since BACKLOG-143; setting the zone to the one we are already in forces the render
 * without moving anybody, so the two readings are of the same instant.
 */
const reengrave = async (p: Page) =>
  setZone(p, await p.evaluate(() => ((window as W).__zone as () => string)()));

test('the brass is one object per line, and it says exactly what plaqueLines says', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);

  await reengrave(page);
  const drawn = await rows(page);

  // S3 — more than one row exists at all, which is the whole geometry change.
  expect(drawn.length).toBeGreaterThan(1);

  // S4 — and the rows read top-to-bottom exactly as the pure function writes them: none lost, none
  // reordered, none invented.
  expect(drawn.map((r) => r.text)).toEqual(await lines(page));

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

  const after = await rows(page);
  expect(after.map((r) => r.text)).toEqual(await lines(page));
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
