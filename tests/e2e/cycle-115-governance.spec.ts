import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The provider's say (BACKLOG-463) — a zone with a standing provider (448) gains a persistent, provider-set
 * spend priority ('feed' | 'bank'). The pure mechanics (reserve, build-defer, temperament mapping) are unit-
 * covered in world/governance.test.ts; this proves the integration seam: no policy until a provider emerges,
 * a policy once one does, stable on re-read, and the no-provider path leaves the existing hooks untouched.
 */

type W = Record<string, any>;

const spendPriority = (p: Page, zone: string) =>
  p.evaluate((z) => (window as W).__spendPriority(z) as 'feed' | 'bank' | null, zone);
const roles = (p: Page) => p.evaluate(() => (window as W).__roles() as Record<string, string>);
const dinoNames = (p: Page) =>
  p.evaluate(() => ((window as W).__dinoPositions() as { name: string }[]).map((d) => d.name));

async function harvestBowl(page: Page) {
  const planted = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
}

async function onlyResident(page: Page, keep: string) {
  for (const n of await dinoNames(page)) {
    if (n !== keep) await page.evaluate((nn) => (window as W).__migrate(nn, 'grove'), n);
  }
}

test('a zone has no spend policy until a provider emerges, then one set by that provider', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Young park: no provider, no policy — the compatibility seam (both hooks inert).
  expect(await spendPriority(page, 'bowl')).toBeNull();

  await onlyResident(page, 'Rex');
  await harvestBowl(page);
  await harvestBowl(page);
  await harvestBowl(page);
  expect((await roles(page)).Rex).toBe('provider');

  // A provider stands → the zone now has a policy, one of the two literals, stable on re-read.
  const p = await spendPriority(page, 'bowl');
  expect(p === 'feed' || p === 'bank').toBe(true);
  expect(await spendPriority(page, 'bowl')).toBe(p);

  expect(errors).toEqual([]);
});
