import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * The friend-found moment's host (BACKLOG-571). On a fresh save Twitch has no friends (565); the first time
 * its bond clears the floor, a 🌱 mark is placed over it — once, ever.
 */

type W = Record<string, any>;
const pops = (p: Page) => p.evaluate(() => (window as W).__friendFoundPops() as number);
const bondPair = (p: Page, a: string, b: string, amt: number) =>
  p.evaluate(({ a, b, amt }) => (window as W).__bondPair(a, b, amt), { a, b, amt });

test('the founding loner finds a friend and a sprig pops over it, once', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await boot(page);
  await foundingState(page, 'as-shipped'); // the founding loner is the point

  expect(await page.evaluate(() => (window as W).__isLoner('Twitch'))).toBe(true);
  expect(await pops(page)).toBe(0);

  await bondPair(page, 'Twitch', 'Sunny', 10);
  expect(await pops(page)).toBe(1);
  const mem = await page.evaluate(() => ((window as W).__memory().Twitch ?? []) as string[]);
  expect(mem.some((m) => m.includes('found a friend'))).toBe(true);

  await bondPair(page, 'Twitch', 'Rex', 10);
  expect(await pops(page)).toBe(1); // one-shot
  expect(errors).toEqual([]);
});
