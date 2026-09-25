import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState, settle } from './helpers';

/**
 * BACKLOG-560/561 — the other two keeper lines' registers.
 *
 * Three lines on this brass are about whoever is standing there and until tonight only the bottom one
 * was engraved, which reads as an accident rather than as a system. Like the cycle-167 spec before it,
 * this asserts what is **blitted** — `__plaqueMarks` reports the live `Image`s — rather than that a rig
 * exists somewhere.
 */

type W = Record<string, unknown>;

interface Row {
  text: string;
  kind: 'stat' | 'keeper';
  color: string;
}
type Mark = { visible: boolean; x: number; y: number };

const rows = (p: Page) => p.evaluate(() => ((window as W).__plaqueRows as () => Row[])());
const marks = (p: Page) => p.evaluate(() => ((window as W).__plaqueMarks as () => Record<string, Mark>)());
/** Force a render so the drawn rows and the marks are read from the same instant (cycle-167's helper). */
const reengrave = async (p: Page) =>
  p.evaluate((z) => ((window as W).__setZone as (x: string) => void)(z), await p.evaluate(() => ((window as W).__zone as () => string)()));

test('all three keeper lines are engraved on the first frame of a fresh save', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await reengrave(page);

  const m = await marks(page);
  expect(Object.keys(m).sort()).toEqual(['sitting', 'streak', 'watch']);
  for (const key of ['watch', 'sitting', 'streak']) {
    expect(m[key], `${key} is struck`).toBeDefined();
    expect(m[key].visible, `${key} is visible`).toBe(true);
    expect(m[key].x, `${key} stands left of the brass's centre line`).toBeLessThan(0);
  }
  expect(errors).toEqual([]);
});

test('each register rides its own line, and they stack in the order the brass does', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await settle(page);
  await reengrave(page);

  const drawn = await rows(page);
  const m = await marks(page);

  // The three keeper rows exist, in the documented order: the whole tenure, then this visit, then the
  // days kept — outward from the longest span to the shortest.
  const watchRow = drawn.findIndex((r) => r.text.startsWith('Watch · '));
  const sittingRow = drawn.findIndex((r) => r.text.startsWith('Sitting · '));
  const streakRow = drawn.findIndex((r) => r.text.startsWith('Keeper · '));
  expect(watchRow).toBeGreaterThanOrEqual(0);
  expect(sittingRow).toBeGreaterThan(watchRow);
  expect(streakRow).toBeGreaterThan(sittingRow);
  for (const i of [watchRow, sittingRow, streakRow]) expect(drawn[i].kind).toBe('keeper');

  // And each mark sits at its own row's height, in the same order — a register that found its row by
  // index rather than by prefix would pass the visibility test above and fail this one.
  expect(m.watch.y).toBeLessThan(m.sitting.y);
  expect(m.sitting.y).toBeLessThan(m.streak.y);
});

// The claim that the three engravings are *different shapes* is the unit file's
// (`cycle-168-keeper-registers.test.ts`, "the two cannot be mistaken for each other"). It is not
// restated here: a grid comparison needs the rig table, the browser has no hook for it, and a spec
// that skips itself into permanent green is worse than no spec at all.
