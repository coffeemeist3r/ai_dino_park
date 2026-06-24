import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * News pulls a newcomer (BACKLOG-345). A bowl dino that has only *heard* about the pond (342) — never
 * crossed — is the one the next migration roll prefers. Gossip moving a body, not just a memory.
 */

type W = Record<string, any>;

const migrating = (p: Page) => p.evaluate(() => (window as W).__migrating() as string[]);
const step = (p: Page) => p.evaluate(() => (window as W).__stepWorld());

async function crossOnce(p: Page, name: string) {
  await p.evaluate((n) => (window as W).__startMigration(n), name);
  for (let i = 0; i < 40; i++) {
    await step(p);
    if (!(await migrating(p)).includes(name)) return;
  }
  throw new Error(`${name} never finished crossing`);
}

test('grove news pulls a curious, un-traveled bowl dino over a coin-flip', async ({ page }) => {
  await boot(page);

  // Rex goes out to the grove and back, so it carries first-hand grove news (but is now grove-visited).
  await crossOnce(page, 'Rex'); // bowl → grove
  await crossOnce(page, 'Rex'); // grove → bowl

  // Mossback (bowl, never crossed) hears the news from Rex → it's the grove-curious one.
  await page.evaluate(() => (window as W).__spreadGroveWord('Rex', 'Mossback'));

  // The migrant pick prefers the curious newcomer: Mossback is chosen and starts crossing.
  const chosen = await page.evaluate(() => (window as W).__maybeMigrate());
  expect(chosen).toBe('Mossback');
  expect(await migrating(page)).toContain('Mossback');
});
