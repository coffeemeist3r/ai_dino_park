import { test, expect, type Page } from '@playwright/test';
import { boot } from './helpers';

/**
 * Word of the provider (BACKLOG-453) — the provider role (448) stops being a lens tag and gets said out
 * loud. A resident names whoever keeps its ground fed, to the keeper and to the next dino it meets; the
 * provider itself never brings it up. Milestone 6's last lore arc.
 */

type W = Record<string, any>;

const events = (p: Page) => p.evaluate(() => (window as W).__events() as string[]);
const memory = (p: Page) => p.evaluate(() => (window as W).__memory() as Record<string, string[]>);

/** Plant the bowl plot, jump the clock past ripening, and harvest it (the cycle-107 fixture). */
async function harvestBowl(page: Page) {
  const planted = await page.evaluate(() => (window as W).__plantPlot('bowl'));
  await page.evaluate((d) => (window as W).__setClock(d + 2, 8, 0), planted.plantedDay);
  await page.evaluate(() => (window as W).__stepWorld());
  await page.evaluate(() => (window as W).__harvestPlot('bowl'));
}

/** Make Sunny the bowl's provider: sole resident while three harvests bank, then the witnesses walk back. */
async function bowlProviderSunny(page: Page, witnesses: string[] = []) {
  for (const n of ['Rex', 'Mossback', 'Twitch', 'Glade']) {
    await page.evaluate((nn) => (window as W).__migrate(nn, 'grove'), n);
  }
  await harvestBowl(page);
  await harvestBowl(page);
  await harvestBowl(page);
  expect((await page.evaluate(() => (window as W).__roles() as Record<string, string>)).Sunny).toBe('provider');
  for (const n of witnesses) await page.evaluate((nn) => (window as W).__migrate(nn, 'bowl'), n);
}

const greet = (p: Page, name: string) =>
  p.evaluate((n) => (window as W).__pickTone(n, 'warm') as Promise<string>, name);

test('a resident tells the keeper who keeps its ground fed', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);

  await bowlProviderSunny(page, ['Rex']);

  const line = await greet(page, 'Rex');
  expect(line).toContain('Sunny');
  expect(line).toContain('Pocket Cretaceous eats because of Sunny');

  expect(errors).toEqual([]);
});

test('the provider never talks up its own pantry', async ({ page }) => {
  await boot(page);
  await bowlProviderSunny(page);

  const line = await greet(page, 'Sunny');
  expect(line).not.toContain('eats because of');
});

test('a dino with no provider on its ground says nothing about one', async ({ page }) => {
  await boot(page);

  const line = await greet(page, 'Rex');
  expect(line).not.toContain('eats because of');
});

test('the word travels: one dino passes the provider on to the next it meets', async ({ page }) => {
  await boot(page);
  await bowlProviderSunny(page, ['Rex', 'Mossback']);

  // __forceConverse runs the roster's first two dinos — Rex speaks, Mossback listens; neither is Sunny.
  await page.evaluate(() => (window as W).__forceConverse());

  expect((await events(page)).some((e) => e.includes('🧺') && e.includes('heard who keeps'))).toBe(true);
  const heard = (await memory(page)).Mossback ?? [];
  expect(heard.some((m) => m.includes('Sunny') && m.includes('eats because of'))).toBe(true);
});
