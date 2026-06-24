import { test, expect } from '@playwright/test';
import { boot } from './helpers';

/**
 * Tell of the grove (BACKLOG-342). A dino crossing *back* to the bowl from the grove files a first-hand
 * grove-news memory and leads its next meeting with it (the gossip cascade), the same 1-hop way word of
 * a cold night travels. Only the return crossing files it.
 */

type W = Record<string, any>;

const migrating = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const memOf = (p: import('@playwright/test').Page, name: string) =>
  p.evaluate((n) => ((window as W).__memory() as Record<string, string[]>)[n] ?? [], name);
const step = (p: import('@playwright/test').Page) => p.evaluate(() => (window as W).__stepWorld());

async function crossOnce(p: import('@playwright/test').Page, name: string) {
  await p.evaluate((n) => (window as W).__startMigration(n), name);
  for (let i = 0; i < 40; i++) {
    await step(p);
    if (!(await migrating(p)).includes(name)) return;
  }
  throw new Error(`${name} never finished crossing`);
}

test('a dino back from the grove carries grove news and leads its next gossip with it', async ({ page }) => {
  await boot(page);

  // Rex out to the grove, then back to the bowl — the return files the grove-news memory.
  await crossOnce(page, 'Rex'); // bowl → grove
  await crossOnce(page, 'Rex'); // grove → bowl
  expect((await memOf(page, 'Rex')).some((m) => m.includes('pond over in the grove'))).toBe(true);

  // Meeting another dino, Rex leads with grove word — the listener remembers the 1-hop rumor.
  const rumor = await page.evaluate(() => (window as W).__spreadGroveWord('Rex', 'Mossback'));
  expect(rumor).toContain('pond over in the grove');
  expect(await memOf(page, 'Mossback')).toContain(rumor);
});
