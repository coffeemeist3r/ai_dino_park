import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';
import { FOUNDING_BONDS } from '../../game/src/world/founding';

type W = Record<string, any>;
const key = (a: string, b: string) => [a, b].sort().join('|');
const founded = (page: import('@playwright/test').Page) =>
  expect.poll(() => page.evaluate(() => (window as W).__bonds()['Rex|Sunny'] ?? 0)).toBe(30);

test('a fresh park opens with its founding friendships, and one dino with none', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await founded(page);
  const bonds = await page.evaluate(() => (window as W).__bonds());
  for (const [a, b, v] of FOUNDING_BONDS) expect(bonds[key(a, b)]).toBe(v);
  expect(await page.evaluate(() => (window as W).__loners())).toEqual(['Twitch']);
});

test('a restored save keeps its own graph and is not re-seeded', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await founded(page);
  await page.evaluate(() => (window as W).__bondPair('Rex', 'Sunny', -30));
  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await boot(page);
  await foundingState(page, 'as-shipped');
  await expect.poll(() => page.evaluate(() => (window as W).__bonds()['Glade|Mossback'] ?? 0)).toBe(24);
  expect(await page.evaluate(() => (window as W).__bonds()['Rex|Sunny'] ?? 0)).toBe(0);
});

test('eighty world steps no longer fill the bowl to the cap', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await founded(page);
  await page.evaluate(() => {
    for (let i = 0; i < 80; i++) (window as W).__stepWorld();
  });
  const bonds: Record<string, number> = await page.evaluate(() => (window as W).__bonds());
  const bowl = ['Rex', 'Mossback', 'Sunny', 'Twitch', 'Glade'];
  const pairs = bowl.flatMap((a, i) => bowl.slice(i + 1).map((b) => bonds[key(a, b)] ?? 0));
  expect(Math.min(...pairs)).toBeLessThan(90);
  expect(Math.max(...pairs)).toBeLessThan(100);
});

test('the bonds lens has something to draw on frame one, and the book shows whole points', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await founded(page);
  await page.evaluate(() => {
    const w = window as W;
    while (w.__lens() !== 'bonds') w.__cycleLens();
  });
  await expect.poll(() => page.evaluate(() => (window as W).__bondLines())).toBeGreaterThan(0);
  await page.evaluate(() => {
    for (let i = 0; i < 5; i++) (window as W).__stepWorld();
  });
  const text: string = await page.evaluate(() => (window as W).__bookText());
  for (const m of text.matchAll(/bond:(\S+)/g)) expect(m[1]).toMatch(/^\d+$/);
});
