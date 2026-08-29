import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The say changes hands (BACKLOG-467) — when a zone crowns (or turns over) its provider (448), the incoming
 * one's spend priority (463) re-sets and the handover lands a one-off logged beat on the keeper's ticker. The
 * pure wording is unit-covered (world/handover.test.ts); this proves the integration seam: no beat until a
 * provider stands, one beat when it does, tracked persistently, and never a repeat while it holds.
 */
type W = Record<string, any>;

const roles = (p: Page) => p.evaluate(() => (window as W).__roles() as Record<string, string>);
const ticker = (p: Page) => p.evaluate(() => (window as W).__ticker() as string[]);
const heldBy = (p: Page) => p.evaluate(() => (window as W).__providerHandover() as Record<string, string>);
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

const TABLE_RE = /sets the Pocket Cretaceous's table now/; // BACKLOG-499: the ground goes through theZone

test('the say changing hands lands one logged beat on the keeper ticker', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  // Young park: no provider, no say tracked, no beat.
  expect(await heldBy(page)).toEqual({});

  await onlyResident(page, 'Rex');
  await harvestBowl(page);
  await harvestBowl(page);
  await harvestBowl(page);
  expect((await roles(page)).Rex).toBe('provider');

  // The next world step is the first to see Rex hold the say → it fires exactly one handover beat.
  await page.evaluate(() => (window as W).__stepWorld());
  expect((await heldBy(page)).bowl).toBe('Rex');
  const news = await ticker(page);
  expect(news.filter((l) => TABLE_RE.test(l))).toHaveLength(1);
  // the beat names Rex and carries a governance tail (mouths/walls first).
  const beat = news.find((l) => TABLE_RE.test(l))!;
  expect(beat).toContain('Rex');
  expect(beat).toMatch(/mouths before walls|walls before mouths/);

  // A standing provider is not news every step — a further step logs no second beat (one-off).
  await page.evaluate(() => (window as W).__stepWorld());
  const news2 = await ticker(page);
  expect(news2.filter((l) => TABLE_RE.test(l)).length).toBeLessThanOrEqual(1);

  expect(errors).toEqual([]);
});
