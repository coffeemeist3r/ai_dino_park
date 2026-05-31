import { test, expect } from '@playwright/test';

import { boot } from './helpers';

test('greeting a dino raises its hearts and persists across reload', async ({ page }) => {
  await boot(page);
  // One greet adds ~3 points; a heart is 10 points, so greet enough to cross at least one.
  const after = await page.evaluate(() => {
    const greet = (window as Record<string, unknown>).__greet as (n: string) => number;
    let hearts = 0;
    for (let i = 0; i < 5; i++) hearts = greet('Rex');
    return hearts;
  });
  expect(after).toBeGreaterThanOrEqual(1);
  await page.evaluate(() => ((window as Record<string, unknown>).__saveNow as () => Promise<unknown>)());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const f = (window as Record<string, unknown>).__hearts as undefined | (() => Record<string, number>);
      return !!f && (f().Rex ?? 0) >= 1;
    },
    { timeout: 8_000 },
  );
});

test('pressing C toggles the hearts panel', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();
  const visible = () =>
    page.evaluate(() => ((window as Record<string, unknown>).__heartsPanelVisible as () => boolean)());
  expect(await visible()).toBe(false);
  await page.keyboard.press('KeyC');
  await page.waitForTimeout(100);
  expect(await visible()).toBe(true);
  await page.keyboard.press('KeyC');
  await page.waitForTimeout(100);
  expect(await visible()).toBe(false);
});
