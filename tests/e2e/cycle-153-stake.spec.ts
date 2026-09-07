import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { STAKE_KEPT_ART_KEY, STAKE_NATIVE_ART_KEY } from '../../game/src/world/stake';
import { FOUNDING_RUIN } from '../../game/src/world/founding';

type W = Record<string, unknown>;

const stake = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__stake as () => string | null)());

const derelict = (page: import('@playwright/test').Page, zone: string) =>
  page.evaluate(
    (z) => ((window as W).__landmarks as (x: string) => Array<{ derelict: boolean }>)(z).filter((l) => l.derelict).length,
    zone,
  );

/**
 * BACKLOG-535 — the founder's mark learns whether the ground is being kept up.
 *
 * This is the bar answer as a spec rather than as a sentence. The founder's-stake family has had three
 * states since cycle 145 and every one of them is a thing the player *finds already set* — who founded this
 * ground, and whether they are still here. This is the first one that **changes while you are standing
 * there**, and the thing that changes it is the mend errand the park already ships on a fresh save.
 */
test('the Grove stake goes from founded to kept when somebody mends the cairn', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  await page.evaluate((z) => ((window as W).__setZone as (x: string) => void)(z), FOUNDING_RUIN.zone);

  // Frame one: founded, and not kept — the ruin is down.
  expect(await derelict(page, FOUNDING_RUIN.zone)).toBe(1);
  expect(await stake(page)).toBe(STAKE_NATIVE_ART_KEY);

  // The errand, driven through the production path (`checkMend` + `stepMend`) rather than waited on.
  for (let i = 0; i < 40; i++) {
    await page.evaluate(() => ((window as W).__stepMend as () => unknown)());
    if ((await derelict(page, FOUNDING_RUIN.zone)) === 0) break;
  }

  expect(await derelict(page, FOUNDING_RUIN.zone)).toBe(0);
  expect(await stake(page)).toBe(STAKE_KEPT_ART_KEY);
});

test('a ground with nothing raised is not "kept" — nothing is not the same as nothing broken', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');

  // The bowl ships bare: founded, lived on, and with no skyline at all.
  expect(await page.evaluate(() => ((window as W).__standing as () => number)())).toBe(0);
  expect(await stake(page)).not.toBe(STAKE_KEPT_ART_KEY);
  expect(await stake(page)).toBeTruthy(); // it still shows a founder's mark
});
