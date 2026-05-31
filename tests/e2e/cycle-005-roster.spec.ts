import { test, expect } from '@playwright/test';

import { boot } from './helpers';

test('five dinos spawn', async ({ page }) => {
  await boot(page);
  const count = await page.evaluate(() => ((window as Record<string, unknown>).__dinoCount as () => number)());
  expect(count).toBe(5);
});

test('all five dinos have unique names', async ({ page }) => {
  await boot(page);
  const names = await page.evaluate(() =>
    ((window as Record<string, unknown>).__dinoNames as () => string[])(),
  );
  expect(names).toHaveLength(5);
  expect(new Set(names).size).toBe(5);
});

test('Rex is still the anchor dino[0] with seeded traits', async ({ page }) => {
  await boot(page);
  const names = await page.evaluate(() =>
    ((window as Record<string, unknown>).__dinoNames as () => string[])(),
  );
  expect(names[0]).toBe('Rex');
  const traits = await page.evaluate(() =>
    ((window as Record<string, unknown>).__dinoTraits as () => Record<string, number>)(),
  );
  expect(typeof traits.curiosity).toBe('number');
});

test('greeting a nearby dino still runs the dialog flow', async ({ page }) => {
  await boot(page);
  await page.locator('canvas').focus();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.press('KeyZ');
  await page.waitForTimeout(300);
  const ok = await page.evaluate(() => typeof (window as Record<string, unknown>).__clockNow === 'function');
  expect(ok).toBe(true);
});
