import { test, expect, type Page } from '@playwright/test';
import { boot, emptyGrounds } from './helpers';

/**
 * The provider's read on the lens (BACKLOG-468) — each zone's spend policy (463) becomes a column on the
 * zone map. The pure mechanics (glyph mapping, the optional column, back-compat) are unit-covered in
 * cycle-117-spend-lens.test.ts; this proves the lens reads *live*: null across a young park, and matching
 * `__spendPriority` for a ground once a provider has set its table.
 */

type W = Record<string, any>;

const zoneMap = (p: Page) =>
  p.evaluate(() => (window as W).__zoneMap() as Array<{ id: string; spend: 'feed' | 'bank' | null }>);
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

test('the zone map reads each ground\'s spend policy, and nothing before one is set', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await emptyGrounds(page); // BACKLOG-492: the founding Grove now seats a council; this spec's subject is not the founding state

  // A young park has decided nothing anywhere — every box reads no policy.
  const before = await zoneMap(page);
  expect(before.length).toBeGreaterThan(0);
  expect(before.every((e) => e.spend === null)).toBe(true);

  const [keeperDino] = await dinoNames(page);
  await onlyResident(page, keeperDino);
  await harvestBowl(page);
  await harvestBowl(page);
  await harvestBowl(page);
  expect((await roles(page))[keeperDino]).toBe('provider');

  // The lens now shows the bowl's policy, and shows exactly what the sim is actually running on.
  const after = await zoneMap(page);
  const bowl = after.find((e) => e.id === 'bowl')!;
  expect(bowl.spend).toBe(await spendPriority(page, 'bowl'));
  expect(bowl.spend === 'feed' || bowl.spend === 'bank').toBe(true);

  expect(errors).toEqual([]);
});
