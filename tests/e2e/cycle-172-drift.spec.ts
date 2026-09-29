import { test, expect } from '@playwright/test';
import { boot, foundingState } from './helpers';

type W = Record<string, any>;

test('a friendship across grounds cools each step, never under the floor, and a held park does not drift', async ({ page }) => {
  await boot(page);
  await foundingState(page, 'as-shipped');
  expect(await page.evaluate(() => (window as W).__bondDrift())).toBeGreaterThan(0);
  // Rex wakes in the Bowl, Pip in the Grove — they cannot meet, so only drift moves the pair.
  await page.evaluate(() => (window as W).__bondPair('Rex', 'Pip', 60));
  const after: number = await page.evaluate(() => {
    const w = window as W;
    for (let i = 0; i < 5; i++) w.__stepWorld();
    return w.__bonds()['Pip|Rex'];
  });
  expect(after).toBeLessThan(60);
  expect(after).toBeGreaterThan(8);
  const held: number = await page.evaluate(() => {
    const w = window as W;
    w.__holdAmbient();
    for (let i = 0; i < 5; i++) w.__stepWorld();
    return w.__bonds()['Pip|Rex'];
  });
  expect(held).toBe(after);
});
