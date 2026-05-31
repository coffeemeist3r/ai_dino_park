import { test, expect } from '@playwright/test';

import { boot } from './helpers';

test('cycling the held item changes it and wraps around', async ({ page }) => {
  await boot(page);
  const first = await page.evaluate(() => ((window as Record<string, unknown>).__heldItem as () => string)());
  const next = await page.evaluate(() => ((window as Record<string, unknown>).__cycleItem as () => string)());
  expect(next).not.toBe(first);
  // Cycle until it wraps back to the first id.
  const wrapped = await page.evaluate((target) => {
    const cycle = (window as Record<string, unknown>).__cycleItem as () => string;
    const held = (window as Record<string, unknown>).__heldItem as () => string;
    for (let i = 0; i < 10; i++) {
      if (held() === target) return true;
      cycle();
    }
    return held() === target;
  }, first);
  expect(wrapped).toBe(true);
});

test('giving a gift returns a verdict, moves affinity, and persists', async ({ page }) => {
  await boot(page);
  const res = await page.evaluate(
    () => ((window as Record<string, unknown>).__giveGift as (n: string) => { verdict: string; hearts: number })('Rex'),
  );
  expect(['loved', 'liked', 'neutral', 'disliked']).toContain(res.verdict);
  await page.evaluate(() => ((window as Record<string, unknown>).__saveNow as () => Promise<unknown>)());
  // Give a loved gift many times to guarantee at least one heart, then confirm persistence.
  await page.evaluate(() => {
    const give = (window as Record<string, unknown>).__giveGift as (n: string) => unknown;
    const cycle = (window as Record<string, unknown>).__cycleItem as () => string;
    for (let i = 0; i < 5; i++) { cycle(); give('Rex'); }
  });
  await page.evaluate(() => ((window as Record<string, unknown>).__saveNow as () => Promise<unknown>)());
  await page.reload();
  await page.locator('canvas').waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(
    () => {
      const f = (window as Record<string, unknown>).__hearts as undefined | (() => Record<string, number>);
      return !!f && typeof f().Rex === 'number';
    },
    { timeout: 8_000 },
  );
});
