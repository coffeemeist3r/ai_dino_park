import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * The ground with two articles (BACKLOG-499).
 *
 * Four of the six display names carry their own article and the templates prepended another, so the park
 * announced "the The Grove's council calls it" — on the first step of a fresh save, since 488 and 492 put a
 * council call and an upkeep bill inside the first minute. `theZone` is now the one seam every sentence
 * goes through. This spec is the read from the player's side: whatever the park says over a session, it
 * never says it twice.
 */

type W = Record<string, any>;

const log = async (p: Page) => (await p.evaluate(() => (window as W).__events() as string[])).join('\n');

test('the park never doubles an article, over a whole session of talking', async ({ page }) => {
  await boot(page);

  // Drive the beats that name a ground: the upkeep bill call, the council's own calls, and a turnover.
  await page.evaluate(() => (window as W).__runUpkeep(6));
  await page.evaluate(() => (window as W).__setClock(3, 8, 0));
  await page.waitForTimeout(500);

  const text = await log(page);
  expect(text).not.toContain('the The');
  expect(text).not.toContain('the the');
});

test('no ground carries a capital article into the middle of a sentence', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => (window as W).__runUpkeep(6));
  await page.waitForTimeout(300);

  // The other half of 499. A line that *opens* with a ground still reads "🛠️ The Grove patched up its 🗿" —
  // that is a sentence start and the capital is correct. What must never appear again is a capitalised
  // article buried after a word, which is what the templates that dodged the doubling used to produce
  // ("sets The Grove's table now").
  expect(await log(page)).not.toMatch(/[a-z] The (Grove|Hollow|Fernreach|Sunward Ridge|Saltpan)\b/);
});

test('a heading is still a name — the zone lens keeps the capital', async ({ page }) => {
  await boot(page);
  const names = await page.evaluate(() => (window as W).__zoneMap().map((e: any) => e.name) as string[]);
  expect(names).toContain('The Grove');
  expect(names).toContain('The Saltpan');
});
