import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { BOWL_ID, GROVE_ID } from '../../game/src/world/zones';

type W = Record<string, unknown>;

const upkeep = (p: Page) => p.evaluate(() => ((window as W).__plaque() as { upkeep: string }).upkeep);
const standing = (p: Page, zone: string) =>
  p.evaluate((z) => ((window as W).__standing as (z: string) => number)(z), zone);

/**
 * BACKLOG-536 — the drain rate, on the brass.
 *
 * This is the item's reachability half and the reason it is a track rather than a pure module. `upkeepDue`
 * has billed the Grove a unit an in-game day since BACKLOG-528 put a second landmark on its skyline at
 * cycle 152, and a player has only ever been handed the *result*: a stores line one lower, twenty-four real
 * minutes later, with nothing anywhere saying what the rate was or that there was one.
 */
test('the Grove names what it owes a day, once its ruin is back up', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await page.evaluate((z) => {
    const w = window as W;
    (w.__setZone as (id: string) => void)(z);
  }, GROVE_ID);

  // Before the mend the Grove keeps one landmark, which is under the bill's floor — so it says nothing,
  // and that silence is the pre-528 world the player used to live in permanently.
  expect(await standing(page, GROVE_ID)).toBe(1);
  expect(await upkeep(page)).toBe('');

  // Somebody walks over and puts the cairn back up. This is the first minute of a fresh save.
  await page.evaluate(() => {
    const w = window as W;
    for (let i = 0; i < 60; i++) (w.__stepMend as () => unknown)();
  });
  expect(await standing(page, GROVE_ID)).toBe(2);

  expect(await upkeep(page)).toMatch(/1\/day$/);
});

test('a ground under the bill floor engraves nothing, so most of the park reads as it always did', async ({
  page,
}) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  expect(await standing(page, BOWL_ID)).toBeLessThan(2);
  expect(await upkeep(page)).toBe('');
});
