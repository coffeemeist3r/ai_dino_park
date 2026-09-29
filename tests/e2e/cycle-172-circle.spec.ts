import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, any>;
const joins = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ((window as W).__ticker() as string[]).filter((l) => l.includes('joined your inner circle')).length);

test('a fresh book says nobody yet; one hello puts that dino at #1 with a crown and a ticker line', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => (window as W).__bookText())).toContain('♛ your inner circle: nobody yet');
  await page.evaluate(() => (window as W).__greet('Rex'));
  await expect.poll(() => page.evaluate(() => (window as W).__innerCircle()[0]?.name)).toBe('Rex');
  await expect.poll(() => joins(page)).toBe(1);
  expect(await page.evaluate(() => (window as W).__circleJoins())).toBeGreaterThanOrEqual(1);
  const book: string = await page.evaluate(() => (window as W).__bookText());
  expect(book.split('\n')[1]).toMatch(/^♛ your inner circle: 1 Rex ♥\d+$/);
});

test('the ladder ranks three, and a restored save does not re-announce them', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  await page.evaluate(() => {
    const w = window as W;
    w.__setFriendship('Sunny', 40);
    w.__setFriendship('Rex', 25);
    w.__setFriendship('Mossback', 12);
    w.__setFriendship('Glade', 5);
  });
  await expect.poll(() => page.evaluate(() => (window as W).__innerCircle().map((c: W) => c.name))).toEqual(['Sunny', 'Rex', 'Mossback']);
  await expect.poll(() => joins(page)).toBe(3);
  await page.evaluate(() => (window as W).__saveNow());
  await page.reload();
  await boot(page);
  await foundingState(page, 'as-shipped');
  await expect.poll(() => page.evaluate(() => (window as W).__innerCircle().length)).toBe(3);
  const before = await joins(page);
  await page.waitForTimeout(500);
  expect(await joins(page)).toBe(before);
  expect(before).toBeLessThanOrEqual(3);
});
