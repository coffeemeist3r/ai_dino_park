import { test, expect, type Page } from '@playwright/test';
import { boot, foundingState } from './helpers';

/**
 * BACKLOG-574 — the park keeps grudges. A fresh park opens with one feud on the bowl, the book names it on
 * both pages, and a contested drop at the hatch feeds it.
 */

type W = Record<string, any>;
const grudges = (p: Page): Promise<Record<string, number>> => p.evaluate(() => (window as W).__grudges());
const pageOf = (text: string, name: string) => {
  const lines = text.split('\n');
  const i = lines.findIndex((l) => l.replace('▸', '').startsWith(`${name}  (`));
  return lines.slice(i, i + 5).join('\n');
};

async function founded(page: Page): Promise<void> {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await expect.poll(async () => Object.keys(await grudges(page))).toEqual(['Mossback|Twitch']);
}

test('a fresh park opens with one feud, named on both pages and nowhere else', async ({ page }) => {
  await founded(page);
  expect((await grudges(page))['Mossback|Twitch']).toBeCloseTo(40, 0);
  const text: string = await page.evaluate(() => (window as W).__bookText());
  expect(pageOf(text, 'Mossback')).toContain("😒 doesn't get on with Twitch");
  expect(pageOf(text, 'Twitch')).toContain("😒 doesn't get on with Mossback");
  expect(pageOf(text, 'Rex')).not.toContain('😒');
});

test('a contested drop feeds the grudge between the two who fought over it', async ({ page }) => {
  await founded(page);
  const before = (await grudges(page))['Mossback|Twitch'];
  await page.evaluate(() => (window as W).__dropFood(undefined, 'fish'));
  await page.evaluate(() => (window as W).__forceContest('Mossback', 'Twitch'));
  expect((await grudges(page))['Mossback|Twitch']).toBeCloseTo(before + 6, 5);
});

test('strangers have no feuds either', async ({ page }) => {
  await founded(page);
  await foundingState(page, 'strangers');
  expect(await grudges(page)).toEqual({});
  const text: string = await page.evaluate(() => (window as W).__bookText());
  expect(text).not.toContain('😒');
});
