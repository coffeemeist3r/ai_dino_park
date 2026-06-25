import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Drew them across (BACKLOG-355). Grove news pulls a non-visited bowl dino across (345), but graded by
 * *how fresh* the telling is: a dino just told to its face outranks one whose news has slid to ambient
 * background. With both present, the migration pick takes the freshly-told one.
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

test('the freshly-told dino is drawn across ahead of one whose grove news has gone ambient', async ({ page }) => {
  await boot(page);

  // Rex goes out to the grove and back, so it carries first-hand grove news (and is now grove-visited).
  await crossOnce(page, 'Rex'); // bowl → grove
  await crossOnce(page, 'Rex'); // grove → bowl

  // Mossback hears the news, then three ordinary things happen to it — the telling ages to the back of
  // its memory ring, so its pull cools to ambient (1).
  await page.evaluate(() => {
    const w = window as W;
    w.__spreadGroveWord('Rex', 'Mossback');
    w.__remember('Mossback', 'you nibbled a fern');
    w.__remember('Mossback', 'you dozed in the sun');
    w.__remember('Mossback', 'you ran into Glade');
  });

  // Sunny is told just now — its pull is fresh (2).
  await page.evaluate(() => (window as W).__spreadGroveWord('Rex', 'Sunny'));

  // The pick prefers the freshly-told dino over the ambient one: Sunny, not Mossback.
  const chosen = await page.evaluate(() => (window as W).__maybeMigrate());
  expect(chosen).toBe('Sunny');
  expect(await migrating(page)).toContain('Sunny');
});
